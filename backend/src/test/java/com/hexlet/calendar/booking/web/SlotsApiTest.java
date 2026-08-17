package com.hexlet.calendar.booking.web;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SlotsApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /event-types/{id}/slots — 200 со списком слотов")
    void slotsForExistingType() throws Exception {
        createEventType();

        mockMvc.perform(get("/event-types/consultation-30/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].start").exists())
                .andExpect(jsonPath("$[0].end").exists());
    }

    @Test
    @DisplayName("GET /event-types/{id}/slots — 404 для неизвестного типа")
    void slotsForUnknownType() throws Exception {
        mockMvc.perform(get("/event-types/no-such-type/slots"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    private void createEventType() throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "consultation-30",
                                  "name": "Консультация",
                                  "description": "Описание консультации",
                                  "durationMinutes": 30
                                }
                                """))
                .andExpect(status().isCreated());
    }
}