import { describe, it, expect, beforeEach } from 'vitest';
import { AgentTelemetryService } from '../src/services/agent/AgentTelemetryService.js';
import { AgentBotService } from '../src/services/AgentBotService.js';

describe('AgentTelemetryService - OpenTelemetry GenAI Observability Tests', () => {
  beforeEach(() => {
    AgentTelemetryService.clear();
  });

  it('generates valid OpenTelemetry 32-hex traceId and 16-hex spanId', () => {
    const traceId = AgentTelemetryService.generateTraceId();
    const spanId = AgentTelemetryService.generateSpanId();

    expect(traceId).toBeTypeOf('string');
    expect(traceId.length).toBe(32);
    expect(/^[0-9a-f]{32}$/.test(traceId)).toBe(true);

    expect(spanId).toBeTypeOf('string');
    expect(spanId.length).toBe(16);
    expect(/^[0-9a-f]{16}$/.test(spanId)).toBe(true);
  });

  it('manages trace and span hierarchy with durations and status', () => {
    const { traceId, rootSpanId } = AgentTelemetryService.startTrace('test_turn', {
      query: 'בדיקת טלמטריה'
    });

    expect(traceId).toBeDefined();
    expect(rootSpanId).toBeDefined();

    const childSpanId = AgentTelemetryService.startSpan('nlu_substep', traceId, rootSpanId, 'parse_nlu', {
      input: 'parse test'
    });

    AgentTelemetryService.addSpanEvent(childSpanId, 'entity_extracted', { entity: 'water', value: false });
    AgentTelemetryService.endSpan(childSpanId, 'OK', {
      output: 'parsed_successfully'
    });

    AgentTelemetryService.endSpan(rootSpanId, 'OK', {
      tokens: { promptTokens: 20, completionTokens: 40 }
    });

    const metrics = AgentTelemetryService.getMetrics();
    expect(metrics.totalTraces).toBe(1);
    expect(metrics.totalTokens).toBe(60);
    expect(metrics.totalCostUsd).toBe(0.00); // Strict $0 constraint
    expect(metrics.successRatePercent).toBe(100);

    const traces = AgentTelemetryService.traces;
    expect(traces.length).toBe(1);
    const trace = traces[0];
    expect(trace.spans.length).toBe(2);
    expect(trace.spans[1].parentSpanId).toBe(rootSpanId);
    expect(trace.spans[1].events.length).toBe(1);
    expect(trace.spans[1].events[0].name).toBe('entity_extracted');
  });

  it('detects redundant tool executions within the same trace', () => {
    const { traceId, rootSpanId } = AgentTelemetryService.startTrace('redundancy_test');

    // First tool call
    const span1 = AgentTelemetryService.startSpan('geocode_city', traceId, rootSpanId, 'execute_tool', {
      input: { city: 'ירושלים' }
    });
    AgentTelemetryService.endSpan(span1, 'OK');

    // Duplicate redundant tool call with identical arguments
    const span2 = AgentTelemetryService.startSpan('geocode_city', traceId, rootSpanId, 'execute_tool', {
      input: { city: 'ירושלים' }
    });
    AgentTelemetryService.endSpan(span2, 'OK');

    // End root span
    AgentTelemetryService.endSpan(rootSpanId, 'OK');

    const trace = AgentTelemetryService.traces[0];
    expect(trace.redundantCalls.length).toBe(1);
    expect(trace.redundantCalls[0].toolName).toBe('geocode_city');

    const metrics = AgentTelemetryService.getMetrics();
    expect(metrics.redundantCallsDetected).toBe(1);
  });

  it('exports valid OpenTelemetry OTLP JSON formatted schema', () => {
    const { traceId, rootSpanId } = AgentTelemetryService.startTrace('export_test', { query: 'export' });
    AgentTelemetryService.endSpan(rootSpanId, 'OK');

    const jsonStr = AgentTelemetryService.exportOtlpJson();
    expect(jsonStr).toBeTypeOf('string');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.resourceSpans).toBeDefined();
    expect(parsed.resourceSpans[0].resource.attributes.some(a => a.key === 'service.name')).toBe(true);
    expect(parsed.resourceSpans[0].scopeSpans[0].spans.length).toBeGreaterThan(0);
    expect(parsed.resourceSpans[0].scopeSpans[0].spans[0].traceId).toBe(traceId);
  });

  it('records correlated logs with traceId and level filtering', () => {
    const { traceId, rootSpanId } = AgentTelemetryService.startTrace('logging_test');
    AgentTelemetryService.log('INFO', 'Test log message', { traceId, component: 'TestEngine' });
    AgentTelemetryService.log('WARN', 'Potential hazard detected', { traceId });
    AgentTelemetryService.endSpan(rootSpanId, 'OK');

    expect(AgentTelemetryService.logs.length).toBeGreaterThanOrEqual(2);
    const log = AgentTelemetryService.logs.find(l => l.message === 'Potential hazard detected');
    expect(log).toBeDefined();
    expect(log.level).toBe('WARN');
    expect(log.traceId).toBe(traceId);
  });

  it('instruments AgentBotService.processUserMessage end-to-end with traces and spans', async () => {
    const res = await AgentBotService.processUserMessage('רוצה מחר בצפון מסלול יער מוצל לילד בן 5');
    expect(res).toBeDefined();
    expect(res.traceId).toBeDefined();

    const trace = AgentTelemetryService.traces.find(t => t.traceId === res.traceId);
    expect(trace).toBeDefined();
    expect(trace.status).toBe('OK');
    expect(trace.spans.length).toBeGreaterThanOrEqual(3);

    // Verify presence of child spans
    const spanNames = trace.spans.map(s => s.name);
    expect(spanNames).toContain('invoke_agent');
    expect(spanNames).toContain('guardrails_check');
    expect(spanNames).toContain('parse_nlu');
    expect(spanNames).toContain('geo_filter');
    expect(spanNames).toContain('rank_candidates');

    const metrics = AgentTelemetryService.getMetrics();
    expect(metrics.totalTokens).toBeGreaterThan(0);
    expect(metrics.totalCostUsd).toBe(0.00);
  });
});
