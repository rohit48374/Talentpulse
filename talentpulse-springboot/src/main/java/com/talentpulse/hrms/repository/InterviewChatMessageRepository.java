package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.InterviewChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewChatMessageRepository extends JpaRepository<InterviewChatMessage, Long> {
    List<InterviewChatMessage> findByInterviewRoundIdOrderByTimestampAsc(Long interviewRoundId);
}
