package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);
    java.util.List<User> findByStatus(String status);

    @Query("SELECT u FROM User u WHERE u.employeeId LIKE :prefix% ORDER BY u.employeeId DESC")
    java.util.List<User> findLatestEmployeeIdWithPrefix(@Param("prefix") String prefix);
}

