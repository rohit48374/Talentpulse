package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    java.util.List<AuditLog> findTop10ByOrderByTimestampDesc();
    long countByActionAndTimestampAfter(String action, java.time.LocalDateTime timestamp);
    java.util.List<AuditLog> findByActionIn(java.util.Collection<String> actions);
    java.util.Optional<AuditLog> findFirstByUserIdAndActionOrderByTimestampDesc(Long userId, String action);
}
