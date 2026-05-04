package com.sodamanagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "soda")
public class SodaProperties {

    // ⬇ Defaults, overridden by startup parameters
    private String adminPassword = "admin";
    private String dataFile = "/data/soda-state.json";
    private int initialStock = 0;
    private Cors cors = new Cors();
    private String originUsername = "admin";
    private String originPassword = "admin";
    private String autoAdminUsernames = "";

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public String getDataFile() {
        return dataFile;
    }

    public void setDataFile(String dataFile) {
        this.dataFile = dataFile;
    }

    public int getInitialStock() {
        return initialStock;
    }

    public void setInitialStock(int initialStock) {
        this.initialStock = initialStock;
    }

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public String getOriginUsername() {
        return originUsername;
    }

    public void setOriginUsername(String originUsername) {
        this.originUsername = originUsername;
    }

    public String getOriginPassword() {
        return originPassword;
    }

    public void setOriginPassword(String originPassword) {
        this.originPassword = originPassword;
    }

    public String getAutoAdminUsernames() {
        return autoAdminUsernames;
    }

    public void setAutoAdminUsernames(String autoAdminUsernames) {
        this.autoAdminUsernames = autoAdminUsernames;
    }

    public static class Cors {

        private String allowedOrigins = "*";

        public String getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }
}
