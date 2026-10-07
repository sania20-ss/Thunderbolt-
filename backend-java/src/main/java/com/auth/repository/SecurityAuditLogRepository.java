package com.auth.repository;

import com.auth.model.SecurityAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, Long> {

    List<SecurityAuditLog> findByEmailOrderByTimestampDesc(String email);

    List<SecurityAuditLog> findTop50ByOrderByTimestampDesc();
}
