package com.hexlet.calendar.booking.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SpaForwardTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /book — forward на index.html")
    void forwardBook() throws Exception {
        mockMvc.perform(get("/book"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @DisplayName("GET /book/{id} — forward на index.html")
    void forwardBookSlot() throws Exception {
        mockMvc.perform(get("/book/consultation"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @DisplayName("GET /admin — forward на index.html")
    void forwardAdmin() throws Exception {
        mockMvc.perform(get("/admin"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @DisplayName("GET /event-types — API не затронут SPA-fallback (404 для неизвестного id)")
    void apiUnchanged() throws Exception {
        mockMvc.perform(get("/event-types/no-such-type"))
                .andExpect(status().isNotFound());
    }
}