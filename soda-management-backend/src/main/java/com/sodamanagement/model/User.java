package com.sodamanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class User {

    private String username;
    private String password;
    private Role role;
    private int sodasTaken;
    private int sodasRefilled;
    private double totalMoneySpentOnRefills;

    public User() {
    }

    public User(String username, String password, Role role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public int getSodasTaken() {
        return sodasTaken;
    }

    public void setSodasTaken(int sodasTaken) {
        this.sodasTaken = sodasTaken;
    }

    public int getSodasRefilled() {
        return sodasRefilled;
    }

    public void setSodasRefilled(int sodasRefilled) {
        this.sodasRefilled = sodasRefilled;
    }

    public double getTotalMoneySpentOnRefills() {
        return totalMoneySpentOnRefills;
    }

    public void setTotalMoneySpentOnRefills(double totalMoneySpentOnRefills) {
        this.totalMoneySpentOnRefills = totalMoneySpentOnRefills;
    }
}
