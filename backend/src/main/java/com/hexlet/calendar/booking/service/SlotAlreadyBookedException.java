package com.hexlet.calendar.booking.service;

/** Старт слота уже занят бронированием любого типа → 409 `slot_already_booked`. */
public class SlotAlreadyBookedException extends RuntimeException {

    public SlotAlreadyBookedException() {
        super("Слот уже занят");
    }
}