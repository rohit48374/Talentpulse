package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {
    List<Notification> findByRecipientId(Long recipientId);
    List<Notification> findByRecipientIdAndStatus(Long recipientId, String status);
    long countByRecipientIdAndStatus(Long recipientId, String status);
}
