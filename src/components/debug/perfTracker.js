/**
 * Lightweight performance tracker — shared singleton.
 * Import perfTrackMount / perfTrackRender in any component to log timing.
 */

const _perf = {
    fetchCount: 0,
    activeFetches: 0,
    fetchLog: [],       // [{url, startMs, endMs, durationMs}]
    renderCounts: {},    // {componentName: count}
    mountTimes: {},      // {componentName: timestampMs}
    lastPageSwitch: 0,
    pageSwitchCount: 0,
    tabMounts: {},       // {tabName: mountCount}
};

// Monkey-patch fetch ONCE
if (!window.__perfPatched) {
    window.__perfPatched = true;
    const _originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '?';
        const shortUrl = url.includes('supabase')
            ? 'SB:' + (url.split('/rest/v1/')[1]?.split('?')[0] || url.split('?')[0].slice(-30))
            : url.split('?')[0].slice(-40);

        _perf.fetchCount++;
        _perf.activeFetches++;
        const start = performance.now();
        _perf.fetchLog.push({ url: shortUrl, startMs: Math.round(start), endMs: null, durationMs: null });
        const logEntry = _perf.fetchLog[_perf.fetchLog.length - 1];

        try {
            const response = await _originalFetch.apply(this, args);
            const end = performance.now();
            logEntry.endMs = Math.round(end);
            logEntry.durationMs = Math.round(end - start);
            _perf.activeFetches--;
            return response;
        } catch (err) {
            const end = performance.now();
            logEntry.endMs = Math.round(end);
            logEntry.durationMs = Math.round(end - start);
            logEntry.error = true;
            _perf.activeFetches--;
            throw err;
        }
    };
}

export function perfTrackRender(componentName) {
    _perf.renderCounts[componentName] = (_perf.renderCounts[componentName] || 0) + 1;
}

export function perfTrackMount(componentName) {
    _perf.mountTimes[componentName] = performance.now();
    _perf.tabMounts[componentName] = (_perf.tabMounts[componentName] || 0) + 1;
}

export function perfGetState() {
    return _perf;
}
