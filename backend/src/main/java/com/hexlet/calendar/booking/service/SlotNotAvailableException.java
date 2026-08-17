package com.hexlet.calendar.booking.service;

/** Слот вне окна записи или тип события не существует → 400 `slot_not_available`. */
public class SlotNotAvailableException extends RuntimeException {

    public SlotNotAvailableException() {
        super("Слот вне окна записи или тип события не существует");
    }
}