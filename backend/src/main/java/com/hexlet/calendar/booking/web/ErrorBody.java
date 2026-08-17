package com.hexlet.calendar.booking.web;

/**
 * Тело ошибки контракта: `Error{code:int32}`, а также
 * `SlotAlreadyBookedError{code:"slot_already_booked"}` и
 * `SlotNotAvailableError{code:"slot_not_available"}`.
 */
public record ErrorBody(Object code, String message) {

    public static ErrorBody of(int code, String message) {
        return new ErrorBody(code, message);
    }

    public static ErrorBody of(String code, String message) {
        return new ErrorBody(code, message);
    }
}