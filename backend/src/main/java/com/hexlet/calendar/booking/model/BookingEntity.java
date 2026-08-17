package com.hexlet.calendar.booking.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "bookings")
public class BookingEntity implements Persistable<String> {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_type_id", nullable = false)
    private EventTypeEntity eventType;

    @Column(nullable = false, unique = true)
    private Instant start;

    @Column(name = "\"end\"", nullable = false)
    private Instant end;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Transient
    private transient boolean isNew;

    protected BookingEntity() {
        this.isNew = false;
    }

    public BookingEntity(String id, EventTypeEntity eventType, Instant start, Instant end,
            Instant createdAt) {
        this.id = id;
        this.eventType = eventType;
        this.start = start;
        this.end = end;
        this.createdAt = createdAt;
        this.isNew = true;
    }

    @Override
    public String getId() {
        return id;
    }

    @Override
    @JsonIgnore
    public boolean isNew() {
        return isNew;
    }

    public EventTypeEntity getEventType() {
        return eventType;
    }

    public Instant getStart() {
        return start;
    }

    public Instant getEnd() {
        return end;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}