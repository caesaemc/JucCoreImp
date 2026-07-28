package com.caesaemc.juc.lesson16;

import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record AggregationResponse(
        List<CallOutcome> outcomes,
        Duration elapsed
) {

    public AggregationResponse {
        outcomes = List.copyOf(outcomes);
    }

    public Map<String, String> successfulValues() {
        Map<String, String> values = new LinkedHashMap<>();
        outcomes.stream()
                .filter(CallOutcome::succeeded)
                .forEach(outcome -> values.put(outcome.name(), outcome.value()));
        return Collections.unmodifiableMap(values);
    }

    public boolean degraded() {
        return outcomes.stream().anyMatch(outcome -> !outcome.succeeded());
    }

    public boolean hasCriticalFailure() {
        return outcomes.stream()
                .anyMatch(outcome -> outcome.critical() && !outcome.succeeded());
    }

    public long count(OutcomeStatus status) {
        return outcomes.stream()
                .filter(outcome -> outcome.status() == status)
                .count();
    }
}
