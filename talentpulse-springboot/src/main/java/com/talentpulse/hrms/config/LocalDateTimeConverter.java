package com.talentpulse.hrms.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

@Converter(autoApply = true)
public class LocalDateTimeConverter implements AttributeConverter<LocalDateTime, String> {

    private static final DateTimeFormatter formatter = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE)
            .optionalStart()
            .appendLiteral(' ')
            .optionalEnd()
            .optionalStart()
            .appendLiteral('T')
            .optionalEnd()
            .optionalStart()
            .append(DateTimeFormatter.ISO_LOCAL_TIME)
            .optionalEnd()
            .toFormatter();

    @Override
    public String convertToDatabaseColumn(LocalDateTime attribute) {
        return attribute != null ? attribute.toString() : null;
    }

    @Override
    public LocalDateTime convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        try {
            // Replace space with T to normalize to ISO-8601 if needed, or parse directly
            String normalized = dbData.replace(' ', 'T');
            // If it's a date only, append time
            if (!normalized.contains("T")) {
                normalized += "T00:00:00";
            }
            return LocalDateTime.parse(normalized);
        } catch (Exception e) {
            try {
                // Fallback parser if there is any other format
                return LocalDateTime.parse(dbData, formatter);
            } catch (Exception ex) {
                return null;
            }
        }
    }
}
