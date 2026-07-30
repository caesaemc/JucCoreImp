package com.caesaemc.juc.course02;

import com.caesaemc.juc.course02.SafePublicationLab.ConfigRepository;
import com.caesaemc.juc.course02.SafePublicationLab.Settings;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class Course02ExerciseTest {

    @Test
    void publishesOneImmutableConfigurationVersion() {
        ConfigRepository repository = new ConfigRepository(new Settings(0, 100, 1));
        Settings next = new Settings(1, 250, 2);
        repository.update(next);
        assertSame(next, repository.snapshot());
    }

    @Test
    void sequenceUsesOneMonitorForTheWholeState() {
        Course02Exercise sequence = new Course02Exercise();
        Set<Long> values = ConcurrentHashMap.newKeySet();

        IntStream.range(0, 10_000).parallel().forEach(index -> values.add(sequence.next()));

        assertEquals(10_000, values.size());
        assertEquals(10_000, sequence.current());
        assertSame(DclSingleton.instance(), DclSingleton.instance());
    }
}
