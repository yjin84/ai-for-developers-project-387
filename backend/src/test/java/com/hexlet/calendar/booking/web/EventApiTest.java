package com.hexlet.calendar.booking.web;

import static org.hamcrest.Matchers.hasSize;
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
class EventApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /event-types — пустой список")
    void listEmpty() throws Exception {
        mockMvc.perform(get("/event-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /event-types — список после создания")
    void listAfterCreate() throws Exception {
        createEvent("consultation", "Консультация");

        mockMvc.perform(get("/event-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("consultation"))
                .andExpect(jsonPath("$[0].name").value("Консультация"))
                .andExpect(jsonPath("$[0].durationMinutes").value(30));
    }

    @Test
    @DisplayName("GET /event-types/{id} — 200 для существующего")
    void readFound() throws Exception {
        createEvent("consultation", "Консультация");

        mockMvc.perform(get("/event-types/consultation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("consultation"))
                .andExpect(jsonPath("$.name").value("Консультация"))
                .andExpect(jsonPath("$.description").value("Описание консультации"))
                .andExpect(jsonPath("$.durationMinutes").value(30));
    }

    @Test
    @DisplayName("GET /event-types/{id} — 404 code:404 для неизвестного")
    void readNotFound() throws Exception {
        mockMvc.perform(get("/event-types/no-such-type"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("POST /event-types — 201 и EventType из тела")
    void createOk() throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "consultation-30",
                                  "name": "Консультация",
                                  "description": "Индивидуальная консультация",
                                  "durationMinutes": 30
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("consultation-30"))
                .andExpect(jsonPath("$.name").value("Консультация"))
                .andExpect(jsonPath("$.description").value("Индивидуальная консультация"))
                .andExpect(jsonPath("$.durationMinutes").value(30));
    }

    @Test
    @DisplayName("POST /event-types — дубликат id → 409 code:409")
    void createDuplicateId() throws Exception {
        createEvent("consultation", "Консультация");

        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "consultation",
                                  "name": "Другое название",
                                  "description": "Дубликат идентификатора",
                                  "durationMinutes": 60
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409));
    }

    @Test
    @DisplayName("POST /event-types — невалидный id → 400 code:400")
    void createInvalidId() throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "Bad_ID",
                                  "name": "Консультация",
                                  "description": "Описание",
                                  "durationMinutes": 30
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /event-types — id длиннее 64 → 400 code:400")
    void createTooLongId() throws Exception {
        String longId = "a".repeat(65);
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "name": "Консультация",
                                  "description": "Описание",
                                  "durationMinutes": 30
                                }
                                """.formatted(longId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /event-types — длинный name → 400 code:400")
    void createTooLongName() throws Exception {
        String longName = "n".repeat(101);
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "consultation",
                                  "name": "%s",
                                  "description": "Описание",
                                  "durationMinutes": 30
                                }
                                """.formatted(longName)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /event-types — duration вне 5..480 → 400 code:400")
    void createInvalidDuration() throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "consultation",
                                  "name": "Консультация",
                                  "description": "Описание",
                                  "durationMinutes": 3
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /event-types — нечитаемое тело → 400 code:400")
    void createMalformedBody() throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ not json }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    private void createEvent(String id, String name) throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "name": "%s",
                                  "description": "Описание консультации",
                                  "durationMinutes": 30
                                }
                                """.formatted(id, name)))
                .andExpect(status().isCreated());
    }
}