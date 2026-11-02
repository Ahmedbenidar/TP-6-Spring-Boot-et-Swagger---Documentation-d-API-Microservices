package com.example.studentmanagement.web.erreur;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.example.studentmanagement.exception.EtudiantIntrouvableException;

/**
 * Traduit les exceptions metier en reponses JSON homogenes.
 * Le client recoit toujours le meme format : horodatage, statut, message, chemin.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(EtudiantIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> etudiantIntrouvable(
            EtudiantIntrouvableException exception, WebRequest requete) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(corps(HttpStatus.NOT_FOUND, exception.getMessage(), requete));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> donneesInvalides(
            MethodArgumentNotValidException exception, WebRequest requete) {
        Map<String, String> champs = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(erreur -> champs.put(erreur.getField(), erreur.getDefaultMessage()));

        Map<String, Object> corps = corps(HttpStatus.BAD_REQUEST, "Certaines donnees sont invalides", requete);
        corps.put("champsInvalides", champs);
        return ResponseEntity.badRequest().body(corps);
    }

    private Map<String, Object> corps(HttpStatus statut, String message, WebRequest requete) {
        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("horodatage", LocalDateTime.now().toString());
        corps.put("statut", statut.value());
        corps.put("erreur", statut.getReasonPhrase());
        corps.put("message", message);
        corps.put("chemin", requete.getDescription(false).replace("uri=", ""));
        return corps;
    }
}
