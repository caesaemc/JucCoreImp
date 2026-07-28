package com.caesaemc.juc.lesson16;

import java.time.Duration;

public record CallOutcome(
        String name,
        OutcomeStatus status,
        String value,
        FailureInfo failure,
        Duration elapsed,
        boolean critical
) {

    public static CallOutcome success(
            DownstreamCall call,
            String value,
            Duration elapsed
    ) {
        return new CallOutcome(
                call.name(),
                OutcomeStatus.SUCCESS,
                value,
                null,
                elapsed,
                call.critical()
        );
    }

    public static CallOutcome failed(
            DownstreamCall call,
            Throwable failure,
            Duration elapsed
    ) {
        return new CallOutcome(
                call.name(),
                OutcomeStatus.FAILED,
                null,
                FailureInfo.from(failure),
                elapsed,
                call.critical()
        );
    }

    public static CallOutcome timedOut(
            DownstreamCall call,
            Duration elapsed
    ) {
        return new CallOutcome(
                call.name(),
                OutcomeStatus.TIMED_OUT,
                null,
                null,
                elapsed,
                call.critical()
        );
    }

    public static CallOutcome rejected(
            DownstreamCall call,
            Throwable failure,
            Duration elapsed
    ) {
        return new CallOutcome(
                call.name(),
                OutcomeStatus.REJECTED,
                null,
                FailureInfo.from(failure),
                elapsed,
                call.critical()
        );
    }

    public static CallOutcome cancelled(
            DownstreamCall call,
            Duration elapsed
    ) {
        return new CallOutcome(
                call.name(),
                OutcomeStatus.CANCELLED,
                null,
                null,
                elapsed,
                call.critical()
        );
    }

    public boolean succeeded() {
        return status == OutcomeStatus.SUCCESS;
    }
}
