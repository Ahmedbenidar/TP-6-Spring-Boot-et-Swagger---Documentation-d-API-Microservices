package com.example.studentmanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

/**
 * Description de l'API affichee par Swagger UI.
 * Springdoc detecte les controleurs automatiquement : ce bean ne fait qu'enrichir l'entete.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI studentManagementOpenApi() {
        Contact contact = new Contact()
                .name("Ahmed BEN IDAR")
                .email("etudiant@toubkalit.ma");

        Info info = new Info()
                .title("Student Management API")
                .version("1.0.0")
                .description("API REST de gestion des etudiants : creation, consultation, suppression, "
                        + "recherche, comptage et statistiques par annee de naissance.")
                .contact(contact)
                .license(new License().name("Usage pedagogique - TP 6"));

        return new OpenAPI()
                .info(info)
                .addServersItem(new Server().url("http://localhost:8080").description("Environnement local"))
                .externalDocs(new ExternalDocumentation()
                        .description("Documentation Spring Boot et springdoc-openapi")
                        .url("https://springdoc.org"));
    }
}
