package com.hexlet.calendar.booking.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(SlotProperties slotProperties) {
        return Clock.system(ZoneId.of(slotProperties.timezone()));
    }
}