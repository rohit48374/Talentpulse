package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.PromotionRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionRecommendationRepository extends JpaRepository<PromotionRecommendation, Long>, JpaSpecificationExecutor<PromotionRecommendation> {
    List<PromotionRecommendation> findByEmployeeId(Long employeeId);
}
