package com.talentpulse.hrms.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.LocalDate;

@Converter(autoApply = true)
public class LocalDateConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate attribute) {
        return attribute != null ? attribute.toString() : null;
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        // SQLite might store date in different string formats: yyyy-MM-dd or sometimes yyyy-MM-dd HH:mm:ss...
        // Let's parse flexibly: if it contains space or T, take the prefix up to the separator.
        String datePart = dbData;
        int spaceIndex = dbData.indexOf(' ');
        if (spaceIndex != -1) {
            datePart = dbData.substring(0, spaceIndex);
        } else {
            int tIndex = dbData.indexOf('T');
            if (tIndex != -1) {
                datePart = dbData.substring(0, tIndex);
            }
        }
        try {
            return LocalDate.parse(datePart);
        } catch (Exception e) {
            return null;
        }
    }
}
