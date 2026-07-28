package com.caesaemc.juc.lesson03;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson03Test {

    @Test
    @Timeout(5)
    void shouldStopAndCleanupAfterInterrupt() throws Exception {
        TwoPhaseTerminator terminator = new TwoPhaseTerminator();
        terminator.start();
        assertTrue(terminator.awaitRunning(Duration.ofSeconds(1)));
        terminator.close();

        assertTrue(terminator.isStopped());
    }

    @Test
    void shouldRestorePreviousThreadLocalValue() throws Exception {
        String nested = ThreadLocalScope.callWithRequestId(
                "outer",
                () -> ThreadLocalScope.callWithRequestId(
                        "inner",
                        ThreadLocalScope::currentRequestId
                )
        );

        assertEquals("inner", nested);
        assertNull(ThreadLocalScope.currentRequestId());
    }

    @Test
    @Timeout(5)
    void shouldObserveLifecycleStates() throws InterruptedException {
        ThreadLifecycleDemo.StateTrace trace = ThreadLifecycleDemo.trace();

        assertEquals(Thread.State.NEW, trace.beforeStart());
        assertEquals(Thread.State.WAITING, trace.whileWaiting());
        assertEquals(Thread.State.TERMINATED, trace.afterJoin());
    }

    @Test
    @Timeout(5)
    void guardedMailboxShouldHandleCompletionAndTimeout() throws Exception {
        GuardedMailbox<String> mailbox = new GuardedMailbox<>();
        Thread.ofPlatform().start(() -> mailbox.complete("done"));

        assertEquals("done", mailbox.await(Duration.ofSeconds(1)));
        assertNull(new GuardedMailbox<>().await(Duration.ofMillis(20)));
    }
}
