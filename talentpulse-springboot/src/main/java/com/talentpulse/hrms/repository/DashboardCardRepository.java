package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.DashboardCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DashboardCardRepository extends JpaRepository<DashboardCard, Long> {
    List<DashboardCard> findByApplicableRoleAndIsActiveOrderByPosition(String applicableRole, boolean isActive);
}
