package com.talentpulse.hrms.core.utils;

import java.time.LocalDate;
import java.time.Period;

public class CoreUtils {

    public static int calculateAge(LocalDate birthDate) {
        if (birthDate == null) return 0;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    public static String getFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        if (today.getMonthValue() >= 4) {
            return year + "-" + (year + 1);
        } else {
            return (year - 1) + "-" + year;
        }
    }

    public static LocalDate getFinancialYearStart() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        if (today.getMonthValue() >= 4) {
            return LocalDate.of(year, 4, 1);
        } else {
            return LocalDate.of(year - 1, 4, 1);
        }
    }

    public static LocalDate getFinancialYearEnd() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        if (today.getMonthValue() >= 4) {
            return LocalDate.of(year + 1, 3, 31);
        } else {
            return LocalDate.of(year, 3, 31);
        }
    }
}
