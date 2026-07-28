package com.caesaemc.juc.lesson16;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DegradationPolicyExerciseTest {

    @Test
    @Disabled("完成 DegradationPolicyExercise 后启用")
    void shouldMapOutcomesToApiDecision() {
        DownstreamCall critical = new DownstreamCall(
                "inventory",
                () -> "unused",
                Duration.ofSeconds(1),
                true
        );
        DownstreamCall optional = new DownstreamCall(
                "recommendation",
                () -> "unused",
                Duration.ofSeconds(1),
                false
        );

        assertEquals(
                DegradationPolicyExercise.Decision.OK,
                DegradationPolicyExercise.decide(new AggregationResponse(
                        List.of(
                                CallOutcome.success(
                                        critical,
                                        "ok",
                                        Duration.ZERO
                                )
                        ),
                        Duration.ZERO
                ))
        );
        assertEquals(
                DegradationPolicyExercise.Decision.PARTIAL,
                DegradationPolicyExercise.decide(new AggregationResponse(
                        List.of(
                                CallOutcome.success(
                                        critical,
                                        "ok",
                                        Duration.ZERO
                                ),
                                CallOutcome.timedOut(
                                        optional,
                                        Duration.ZERO
                                )
                        ),
                        Duration.ZERO
                ))
        );
        assertEquals(
                DegradationPolicyExercise.Decision.FAILED,
                DegradationPolicyExercise.decide(new AggregationResponse(
                        List.of(
                                CallOutcome.timedOut(
                                        critical,
                                        Duration.ZERO
                                )
                        ),
                        Duration.ZERO
                ))
        );
    }
}
