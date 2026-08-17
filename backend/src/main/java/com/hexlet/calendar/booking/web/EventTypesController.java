package com.hexlet.calendar.booking.web;

import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.EventTypeRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/event-types")
public class EventTypesController {

    private final EventTypeRepository eventTypeRepository;

    public EventTypesController(EventTypeRepository eventTypeRepository) {
        this.eventTypeRepository = eventTypeRepository;
    }

    @GetMapping
    public List<EventTypeEntity> list() {
        return eventTypeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventTypeEntity> read(@PathVariable String id) {
        return eventTypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<EventTypeEntity> create(@Valid @RequestBody EventTypeCreateRequest body) {
        EventTypeEntity entity = new EventTypeEntity(
                body.id(), body.name(), body.description(), body.durationMinutes());
        EventTypeEntity saved = eventTypeRepository.saveAndFlush(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}