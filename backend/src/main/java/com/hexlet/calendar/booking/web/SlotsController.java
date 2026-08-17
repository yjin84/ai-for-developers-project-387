package com.hexlet.calendar.booking.web;

import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.EventTypeRepository;
import com.hexlet.calendar.booking.service.AvailableSlot;
import com.hexlet.calendar.booking.service.SlotScheduleService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/event-types/{eventTypeId}")
public class SlotsController {

    private final EventTypeRepository eventTypeRepository;
    private final SlotScheduleService slotScheduleService;

    public SlotsController(EventTypeRepository eventTypeRepository,
            SlotScheduleService slotScheduleService) {
        this.eventTypeRepository = eventTypeRepository;
        this.slotScheduleService = slotScheduleService;
    }

    @GetMapping("/slots")
    public List<AvailableSlot> list(@PathVariable String eventTypeId) {
        EventTypeEntity eventType = eventTypeRepository.findById(eventTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return slotScheduleService.freeSlotsFor(eventType);
    }
}