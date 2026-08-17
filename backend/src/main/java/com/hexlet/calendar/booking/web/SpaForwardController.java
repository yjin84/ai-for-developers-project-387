package com.hexlet.calendar.booking.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA-fallback: отдаёт {@code index.html} для клиентских маршрутов
 * react-router, чтобы прямой заход на {@code /book} или {@code /admin}
 * не возвращал 404. API-маппинги ({@code /event-types}, {@code /slots},
 * {@code /bookings}) этим контроллером не затрагиваются.
 */
@Controller
public class SpaForwardController {

    @GetMapping({"/book", "/book/**", "/admin"})
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}