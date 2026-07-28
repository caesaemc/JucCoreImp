package com.caesaemc.juc.lesson06;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PermitGuardExerciseTest {

    @Test
    @Disabled("完成 PermitGuardExercise 后启用")
    void shouldRestorePermitWhenActionFails() {
        PermitGuardExercise guard = new PermitGuardExercise(1);

        assertThrows(IllegalStateException.class, () -> guard.call(() -> {
            throw new IllegalStateException("boom");
        }));
        assertEquals(1, guard.availablePermits());
    }
}
