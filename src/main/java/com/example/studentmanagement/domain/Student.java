package com.example.studentmanagement.domain;

import java.time.LocalDate;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

/**
 * Etudiant inscrit dans un etablissement.
 * Chaque instance correspond a une ligne de la table student.
 */
@Entity
@Table(
        name = "student",
        uniqueConstraints = @UniqueConstraint(name = "uk_student_email", columnNames = "email"))
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 60, message = "Le nom ne doit pas depasser 60 caracteres")
    @Column(name = "nom", nullable = false, length = 60)
    private String nom;

    @NotBlank(message = "Le prenom est obligatoire")
    @Size(max = 60, message = "Le prenom ne doit pas depasser 60 caracteres")
    @Column(name = "prenom", nullable = false, length = 60)
    private String prenom;

    @NotNull(message = "La date de naissance est obligatoire")
    @Past(message = "La date de naissance doit etre dans le passe")
    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @NotBlank(message = "L'adresse e-mail est obligatoire")
    @Email(message = "L'adresse e-mail n'est pas valide")
    @Size(max = 120, message = "L'adresse e-mail ne doit pas depasser 120 caracteres")
    @Column(name = "email", nullable = false, length = 120)
    private String email;

    @NotBlank(message = "La filiere est obligatoire")
    @Size(max = 40, message = "La filiere ne doit pas depasser 40 caracteres")
    @Column(name = "filiere", nullable = false, length = 40)
    private String filiere;

    public Student() {
        // constructeur requis par JPA
    }

    public Student(String nom, String prenom, LocalDate dateNaissance, String email, String filiere) {
        this.nom = nom;
        this.prenom = prenom;
        this.dateNaissance = dateNaissance;
        this.email = email;
        this.filiere = filiere;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public LocalDate getDateNaissance() {
        return dateNaissance;
    }

    public void setDateNaissance(LocalDate dateNaissance) {
        this.dateNaissance = dateNaissance;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFiliere() {
        return filiere;
    }

    public void setFiliere(String filiere) {
        this.filiere = filiere;
    }

    /** Nom complet utilise dans les reponses de l'API et dans Swagger. */
    public String getNomComplet() {
        return (nom == null ? "" : nom) + " " + (prenom == null ? "" : prenom);
    }

    @Override
    public boolean equals(Object autre) {
        if (this == autre) {
            return true;
        }
        if (!(autre instanceof Student)) {
            return false;
        }
        Student etudiant = (Student) autre;
        return id != null && Objects.equals(id, etudiant.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Student{id=" + id + ", nom=" + nom + ", prenom=" + prenom
                + ", dateNaissance=" + dateNaissance + ", filiere=" + filiere + "}";
    }
}
