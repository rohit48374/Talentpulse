# TalentPulse HRMS - Production Deployment Checklist

## Pre-Deployment (Week Before)

### Code Preparation
- [ ] All features tested locally
- [ ] Code review completed
- [ ] No TODO/FIXME comments in production code
- [ ] All dependencies updated to latest stable versions
- [ ] No hardcoded credentials in code
- [ ] Environment-specific configurations externalized
- [ ] Error handling comprehensive
- [ ] Logging configured for production

### Security Audit
- [ ] SQL injection tests passed
- [ ] XSS protection verified
- [ ] CSRF protection enabled
- [ ] Authentication tested thoroughly
- [ ] Authorization rules verified for all roles
- [ ] Sensitive data not logged
- [ ] File uploads validated and scanned
- [ ] API rate limiting configured

### Performance Testing
- [ ] Load testing completed (1000+ concurrent users)
- [ ] Database query optimization done
- [ ] N+1 query problems identified and fixed
- [ ] Caching strategy implemented
- [ ] Static files minified
- [ ] Database indexes created
- [ ] Response times acceptable (< 200ms)

### Documentation
- [ ] API documentation complete
- [ ] Setup guide written
- [ ] Runbook created
- [ ] Troubleshooting guide created
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented

---

## Infrastructure Setup

### Server Setup
- [ ] OS patched to latest security updates
- [ ] Firewall configured
- [ ] SSH access secured (key-based auth)
- [ ] Fail2ban installed
- [ ] Monitoring agent installed
- [ ] Log aggregation configured
- [ ] Backup agents installed
- [ ] DNS records configured

### Database Setup
- [ ] PostgreSQL 12+ installed
- [ ] Database created with UTF-8 encoding
- [ ] Database user created with minimal permissions
- [ ] Automated daily backups configured
- [ ] Point-in-time recovery tested
- [ ] Database performance monitoring enabled
- [ ] Slow query logging enabled
- [ ] Replication configured (if HA)

### Redis Setup (if using)
- [ ] Redis installed and running
- [ ] Redis persistence enabled
- [ ] Redis memory limits configured
- [ ] Redis backups scheduled
- [ ] Redis monitoring enabled
- [ ] Redis password secured
- [ ] Redis bind restricted to internal network

---

## Django Configuration

### Settings.py Review
```python
DEBUG = False  # CRITICAL
SECRET_KEY = <strong-random-key>  # CRITICAL
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### Environment Variables
- [ ] All .env variables set securely
- [ ] No default passwords
- [ ] Strong SECRET_KEY (50+ characters)
- [ ] Database credentials stored in secrets manager
- [ ] API keys stored in secrets manager
- [ ] Email credentials configured
- [ ] AWS/Cloud credentials configured
- [ ] Redis URL configured

### Security Headers
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection enabled
- [ ] Strict-Transport-Security enabled
- [ ] Referrer-Policy configured

### Logging & Monitoring
- [ ] Application logging configured
- [ ] Error logging to file
- [ ] Sentry/error tracking integrated
- [ ] Slow query logging enabled
- [ ] Request/response logging (non-production code)
- [ ] Metrics/monitoring dashboard setup

---

## Webserver Setup (Nginx)

### Nginx Configuration
- [ ] Nginx installed and optimized
- [ ] SSL/TLS certificate installed (Let's Encrypt)
- [ ] SSL configuration hardened (A+ rating on ssllabs.com)
- [ ] Gzip compression enabled
- [ ] Rate limiting configured
- [ ] Request size limits set
- [ ] Proxy headers configured correctly
- [ ] Upstream servers configured

### Sample Nginx Config
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy Configuration
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Static Files
    location /static/ {
        alias /path/to/static/;
    }
    
    # Media Files
    location /media/ {
        alias /path/to/media/;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Application Server (Gunicorn)

### Gunicorn Setup
- [ ] Gunicorn installed
- [ ] Systemd service created
- [ ] Worker count optimized
- [ ] Worker class selected appropriately
- [ ] Timeout values set
- [ ] Access logs configured
- [ ] Error logs configured
- [ ] Process monitoring enabled

### Systemd Service File
```ini
[Unit]
Description=TalentPulse Gunicorn Application Server
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/app
ExecStart=/path/to/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 30 \
    --access-logfile /var/log/talentpulse/access.log \
    --error-logfile /var/log/talentpulse/error.log \
    config.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## SSL/TLS Certificate

### Let's Encrypt Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --webroot -w /path/to/webroot -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run  # Test
sudo systemctl enable certbot.timer
```

### Certificate Monitoring
- [ ] Certificate expiration monitoring enabled
- [ ] Renewal automation working
- [ ] Certificate alerts configured
- [ ] Certificate validity verified

---

## Backup & Recovery

### Database Backups
```bash
# Daily automatic backups
0 2 * * * pg_dump talentpulse_db > /backups/db_$(date +\%Y\%m\%d).sql
```

- [ ] Automated daily backups
- [ ] Weekly full backups
- [ ] Backups stored offsite (S3, etc.)
- [ ] Backup retention policy configured
- [ ] Recovery procedure tested
- [ ] Backup encryption enabled

### Application Backups
- [ ] Code repository backed up
- [ ] Configuration backed up
- [ ] Media files backed up
- [ ] User uploads backed up
- [ ] Log files archived

---

## Monitoring & Alerting

### System Monitoring
- [ ] CPU usage monitoring
- [ ] Memory usage monitoring
- [ ] Disk usage monitoring
- [ ] Network monitoring
- [ ] Process monitoring
- [ ] Service health checks
- [ ] Uptime monitoring
- [ ] Alert recipients configured

### Application Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic/APM)
- [ ] Log aggregation (ELK/Splunk)
- [ ] API response time monitoring
- [ ] Database query performance
- [ ] Business metrics tracking
- [ ] User activity tracking

### Alerts Configuration
- [ ] CPU > 80%
- [ ] Memory > 85%
- [ ] Disk > 90%
- [ ] Service down
- [ ] High error rate
- [ ] High response time
- [ ] Database connection failures
- [ ] SSL certificate expiration

---

## Deployment Day

### Pre-Deployment Tasks (2 hours before)
- [ ] Team notified of deployment
- [ ] Maintenance window announced
- [ ] Backups completed and verified
- [ ] Rollback procedure reviewed
- [ ] On-call team assembled
- [ ] Communication channel established
- [ ] Database snapshots created
- [ ] Current logs archived

### Deployment Steps
1. [ ] Pull latest code from repository
2. [ ] Verify code changes
3. [ ] Install/update dependencies: `pip install -r requirements.txt`
4. [ ] Collect static files: `python manage.py collectstatic --noinput`
5. [ ] Run migrations: `python manage.py migrate`
6. [ ] Run management commands: `python manage.py seed_initial_data`
7. [ ] Clear cache: `python manage.py clear_cache`
8. [ ] Restart Gunicorn: `sudo systemctl restart talentpulse`
9. [ ] Verify Nginx configuration: `sudo nginx -t`
10. [ ] Reload Nginx: `sudo systemctl reload nginx`
11. [ ] Health check: `curl https://yourdomain.com/api/health/`
12. [ ] Smoke tests: Test critical workflows
13. [ ] Monitor logs for errors: `tail -f /var/log/talentpulse/error.log`
14. [ ] Verify database connectivity
15. [ ] Test authentication endpoints
16. [ ] Test employee listing
17. [ ] Announce deployment completion

### Post-Deployment (1 hour after)
- [ ] Verify all systems operational
- [ ] Check error logs for issues
- [ ] Monitor performance metrics
- [ ] User feedback collection
- [ ] Database consistency checks
- [ ] Backup verification
- [ ] Alert verification
- [ ] Performance validation

### Rollback Procedure (if needed)
1. [ ] Revert to previous version
2. [ ] Restore database from backup
3. [ ] Restart services
4. [ ] Verify functionality
5. [ ] Notify stakeholders
6. [ ] Root cause analysis
7. [ ] Update deployment procedure

---

## Post-Deployment (First Week)

### Monitoring
- [ ] Error rate acceptable
- [ ] Response times acceptable
- [ ] Database performance stable
- [ ] No resource leaks
- [ ] Backup completion verified
- [ ] Alert system working
- [ ] Log rotation working
- [ ] No security incidents

### Documentation Updates
- [ ] Deployment notes recorded
- [ ] Any issues documented
- [ ] Configuration changes noted
- [ ] Performance baseline recorded
- [ ] Runbook updated
- [ ] Known issues documented
- [ ] Team trained on changes
- [ ] Support team briefed

---

## Ongoing Maintenance

### Daily
- [ ] Monitor logs for errors
- [ ] Check system health
- [ ] Verify backups
- [ ] Check alerts

### Weekly
- [ ] Review performance metrics
- [ ] Database maintenance
- [ ] Security updates check
- [ ] Capacity planning review

### Monthly
- [ ] Security audit
- [ ] Backup restoration test
- [ ] Performance optimization
- [ ] Disaster recovery drill

### Quarterly
- [ ] Dependency updates
- [ ] Security assessment
- [ ] Capacity planning
- [ ] Architecture review

---

## Emergency Contacts

- **On-Call Engineer:** [Name] - [Phone]
- **Database Admin:** [Name] - [Phone]
- **System Admin:** [Name] - [Phone]
- **Security Team:** [Email]
- **Vendor Support:** [Contact Info]

---

## Deployment Sign-Off

- **Deployed By:** _______________
- **Approved By:** _______________
- **Date:** _______________
- **Time:** _______________
- **Version:** _______________
- **Notes:** _______________

---

**Document Version:** 1.0
**Last Updated:** [Date]
**Next Review:** [Date]
