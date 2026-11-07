/**
 * Couche d'acces a l'API REST Student Management.
 * Toutes les requetes passent par ici : un seul endroit a modifier si l'API change.
 */
(function (global) {
  'use strict';

  var BASE = '';
  var journal = [];

  function horodatage() {
    return new Date().toISOString().slice(11, 23);
  }

  function enregistrer(methode, chemin, statut, duree, ok) {
    journal.unshift({
      methode: methode,
      chemin: chemin,
      statut: statut,
      duree: duree,
      ok: ok,
      heure: horodatage()
    });
    if (journal.length > 40) {
      journal.length = 40;
    }
  }

  function lireJournal() {
    return journal.slice();
  }

  function viderJournal() {
    journal.length = 0;
  }

  /**
   * Erreur applicative portant le statut HTTP et le corps renvoye par l'API,
   * pour que l'interface puisse afficher le message metier (ex. 404, 400).
   */
  function ErreurApi(message, statut, corps) {
    this.name = 'ErreurApi';
    this.message = message;
    this.statut = statut;
    this.corps = corps || null;
    this.champsInvalides = (corps && corps.champsInvalides) || null;
  }
  ErreurApi.prototype = Object.create(Error.prototype);

  function requete(methode, chemin, corps) {
    var debut = performance.now();
    var options = {
      method: methode,
      headers: { Accept: 'application/json' }
    };

    if (corps !== undefined && corps !== null) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(corps);
    }

    return fetch(BASE + chemin, options).then(function (reponse) {
      var duree = Math.round(performance.now() - debut);
      var type = reponse.headers.get('content-type') || '';
      var lecture = type.indexOf('json') !== -1 ? reponse.json() : reponse.text();

      return lecture
        .catch(function () { return null; })
        .then(function (donnees) {
          enregistrer(methode, chemin, reponse.status, duree, reponse.ok);

          if (!reponse.ok) {
            var message = (donnees && donnees.message) || ('Erreur HTTP ' + reponse.status);
            throw new ErreurApi(message, reponse.status, donnees);
          }
          return donnees;
        });
    }, function () {
      var duree = Math.round(performance.now() - debut);
      enregistrer(methode, chemin, 0, duree, false);
      throw new ErreurApi(
        "Le serveur Spring Boot ne repond pas sur " + (global.location.origin || 'localhost:8080') + '.',
        0,
        null
      );
    });
  }

  var Api = {
    ErreurApi: ErreurApi,

    /** GET /students/all */
    lister: function () {
      return requete('GET', '/students/all');
    },

    /** GET /students/{id} */
    trouver: function (id) {
      return requete('GET', '/students/' + encodeURIComponent(id));
    },

    /** GET /students/search?nom= */
    rechercher: function (nom) {
      var suffixe = nom ? '?nom=' + encodeURIComponent(nom) : '';
      return requete('GET', '/students/search' + suffixe);
    },

    /** GET /students/count */
    compter: function () {
      return requete('GET', '/students/count');
    },

    /** GET /students/byYear */
    parAnnee: function () {
      return requete('GET', '/students/byYear');
    },

    /** GET /students/statistiques */
    statistiques: function () {
      return requete('GET', '/students/statistiques');
    },

    /** POST /students/save */
    enregistrer: function (etudiant) {
      return requete('POST', '/students/save', etudiant);
    },

    /** DELETE /students/delete/{id} */
    supprimer: function (id) {
      return requete('DELETE', '/students/delete/' + encodeURIComponent(id));
    },

    lireJournal: lireJournal,
    viderJournal: viderJournal
  };

  global.Api = Api;
})(window);
