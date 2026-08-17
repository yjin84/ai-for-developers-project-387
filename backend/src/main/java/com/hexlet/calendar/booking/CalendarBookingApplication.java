package com.hexlet.calendar.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CalendarBookingApplication {

	public static void main(String[] args) {
		SpringApplication.run(CalendarBookingApplication.class, args);
	}

}
