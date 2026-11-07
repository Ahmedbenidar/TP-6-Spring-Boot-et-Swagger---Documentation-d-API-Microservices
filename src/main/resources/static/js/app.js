/**
 * Interface StudentHub : navigation, rendu des vues et interactions.
 * Aucune dependance externe, tout est en DOM natif.
 */
(function () {
  'use strict';

  var TEINTES = ['#4f46e5', '#0f9d75', '#d98324', '#c2417a', '#2b7fd4', '#7c6cf5', '#0e8f9e', '#b45309'];

  var etat = {
    etudiants: [],
    filtree: [],
    statistiques: null,
    vue: 'tableau',
    recherche: '',
    ficheCourante: null,
    aSupprimer: null,
    chargement: false
  };

  var el = {};

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */

  function $(id) { return document.getElementById(id); }

  function echapper(texte) {
    return String(texte === null || texte === undefined ? '' : texte)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function teinte(cle) {
    var somme = 0;
    var valeur = String(cle || '');
    for (var i = 0; i < valeur.length; i += 1) {
      somme = (somme * 31 + valeur.charCodeAt(i)) % 100000;
    }
    return TEINTES[somme % TEINTES.length];
  }

  function initiales(etudiant) {
    var nom = (etudiant.nom || '').trim();
    var prenom = (etudiant.prenom || '').trim();
    var a = nom.charAt(0);
    var b = prenom.charAt(0);
    return ((a || '') + (b || '')).toUpperCase() || '?';
  }

  function formaterDate(iso) {
    if (!iso) { return '—'; }
    var morceaux = String(iso).split('-');
    if (morceaux.length !== 3) { return iso; }
    return morceaux[2] + '/' + morceaux[1] + '/' + morceaux[0];
  }

  function age(iso) {
    if (!iso) { return null; }
    var naissance = new Date(iso);
    if (isNaN(naissance.getTime())) { return null; }
    var maintenant = new Date();
    var annees = maintenant.getFullYear() - naissance.getFullYear();
    var avant = maintenant.getMonth() < naissance.getMonth()
      || (maintenant.getMonth() === naissance.getMonth() && maintenant.getDate() < naissance.getDate());
    return avant ? annees - 1 : annees;
  }

  function anneeNaissance(iso) {
    return iso ? String(iso).slice(0, 4) : '';
  }

  function debounce(fonction, delai) {
    var minuteur = null;
    return function () {
      var arguments_ = arguments;
      var contexte = this;
      clearTimeout(minuteur);
      minuteur = setTimeout(function () {
        fonction.apply(contexte, arguments_);
      }, delai);
    };
  }

  function animerBarres(selecteur) {
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(document.querySelectorAll(selecteur + '[data-largeur]'), function (noeud) {
        noeud.style.width = noeud.getAttribute('data-largeur') + '%';
      });
      Array.prototype.forEach.call(document.querySelectorAll(selecteur + '[data-hauteur]'), function (noeud) {
        noeud.style.height = noeud.getAttribute('data-hauteur') + '%';
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Notifications                                                       */
  /* ------------------------------------------------------------------ */

  function notifier(type, titre, message) {
    var boite = document.createElement('div');
    boite.className = 'toast ' + type;
    boite.innerHTML = '<div><strong>' + echapper(titre) + '</strong><p>' + echapper(message) + '</p></div>';
    el.toasts.appendChild(boite);

    setTimeout(function () {
      boite.classList.add('sortie');
      setTimeout(function () {
        if (boite.parentNode) { boite.parentNode.removeChild(boite); }
      }, 220);
    }, 4200);
  }

  /* ------------------------------------------------------------------ */
  /* Etat de connexion                                                   */
  /* ------------------------------------------------------------------ */

  function majEtatApi(ok, texte) {
    el.etatApi.setAttribute('data-etat', ok ? 'ok' : 'erreur');
    el.etatApi.querySelector('.etat-texte').textContent = texte;
  }

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  var TITRES = {
    tableau: ['Tableau de bord', "Vue d'ensemble de la promotion"],
    etudiants: ['Etudiants', "Annuaire complet et gestion des fiches"],
    statistiques: ['Statistiques', 'Repartitions calculees par l\'API']
  };

  function afficherVue(nom) {
    if (!TITRES[nom]) { nom = 'tableau'; }
    etat.vue = nom;

    ['tableau', 'etudiants', 'statistiques'].forEach(function (cle) {
      var section = $('vue-' + cle);
      if (section) { section.hidden = cle !== nom; }
    });

    Array.prototype.forEach.call(document.querySelectorAll('.nav-item[data-vue]'), function (lien) {
      lien.classList.toggle('actif', lien.getAttribute('data-vue') === nom);
    });

    el.titreVue.textContent = TITRES[nom][0];
    el.sousTitreVue.textContent = TITRES[nom][1];

    fermerSidebar();

    if (nom === 'statistiques') {
      animerBarres('#graphe-filieres .barre-remplissage');
      animerBarres('#graphe-annees .colonne-barre');
    }

    if (window.location.hash !== '#' + nom) {
      history.replaceState(null, '', '#' + nom);
    }
  }

  function fermerSidebar() {
    el.sidebar.classList.remove('ouverte');
  }

  /* ------------------------------------------------------------------ */
  /* Theme                                                               */
  /* ------------------------------------------------------------------ */

  function appliquerTheme(sombre) {
    document.documentElement.setAttribute('data-theme', sombre ? 'sombre' : 'clair');
    try { localStorage.setItem('studenthub-theme', sombre ? 'sombre' : 'clair'); } catch (e) { /* stockage indisponible */ }
  }

  function initialiserTheme() {
    var enregistre = null;
    try { enregistre = localStorage.getItem('studenthub-theme'); } catch (e) { enregistre = null; }
    var sombre = enregistre
      ? enregistre === 'sombre'
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    appliquerTheme(sombre);
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : indicateurs                                                 */
  /* ------------------------------------------------------------------ */

  function carte(label, valeur, detail, couleur) {
    return '<article class="carte" style="--carte-teinte:' + couleur + '">'
      + '<span class="carte-label">' + echapper(label) + '</span>'
      + '<span class="carte-valeur">' + echapper(valeur) + '</span>'
      + '<span class="carte-detail">' + echapper(detail) + '</span>'
      + '</article>';
  }

  function rendreIndicateurs() {
    var stats = etat.statistiques;
    if (!stats) { return; }

    var filieres = Object.keys(stats.repartitionParFiliere || {});
    var annees = stats.repartitionParAnneeNaissance || [];
    var moyenne = filieres.length
      ? (stats.totalEtudiants / filieres.length).toFixed(1).replace('.', ',')
      : '0';

    el.cartesIndicateurs.innerHTML = [
      carte('Etudiants inscrits', stats.totalEtudiants, 'BASE STUDENT', 'var(--teinte-1)'),
      carte('Filieres couvertes', stats.nombreFilieres, filieres.join(' · ') || '—', 'var(--teinte-3)'),
      carte('Moyenne par filiere', moyenne, 'etudiants par filiere', 'var(--teinte-4)'),
      carte('Annees representees', annees.length, annees.length ? 'de ' + annees[0].annee + ' a ' + annees[annees.length - 1].annee : '—', 'var(--teinte-5)')
    ].join('');

    el.pastilleFilieres.textContent = filieres.length + (filieres.length > 1 ? ' filieres' : ' filiere');
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : barres de repartition                                       */
  /* ------------------------------------------------------------------ */

  function rendreBarres(conteneur, entrees, maximum, avecPourcentage) {
    if (!entrees.length) {
      conteneur.innerHTML = '<p class="journal-vide">Aucune donnee disponible.</p>';
      return;
    }

    var total = entrees.reduce(function (somme, entree) { return somme + entree.valeur; }, 0);

    conteneur.innerHTML = entrees.map(function (entree, index) {
      var largeur = maximum > 0 ? Math.max(4, (entree.valeur / maximum) * 100) : 0;
      var suffixe = avecPourcentage && total
        ? ' · ' + ((entree.valeur / total) * 100).toFixed(0) + ' %'
        : '';
      return '<div class="barre-ligne">'
        + '<div class="barre-tete">'
        + '<span class="barre-nom">' + echapper(entree.label) + '</span>'
        + '<span class="barre-valeur">' + entree.valeur + suffixe + '</span>'
        + '</div>'
        + '<div class="barre-piste">'
        + '<div class="barre-remplissage" style="--barre-teinte:' + TEINTES[index % TEINTES.length] + '" data-largeur="' + largeur.toFixed(1) + '"></div>'
        + '</div>'
        + '</div>';
    }).join('');

    animerBarres(conteneur.id ? '#' + conteneur.id + ' .barre-remplissage' : '.barre-remplissage');
  }

  function rendreMiniFilieres() {
    var repartition = (etat.statistiques && etat.statistiques.repartitionParFiliere) || {};
    var entrees = Object.keys(repartition)
      .map(function (cle) { return { label: cle, valeur: repartition[cle] }; })
      .sort(function (a, b) { return b.valeur - a.valeur; });

    var maximum = entrees.reduce(function (max, entree) { return Math.max(max, entree.valeur); }, 0);
    rendreBarres(el.miniFilieres, entrees, maximum, true);
  }

  function rendreDerniersInscrits() {
    var recents = etat.etudiants.slice().sort(function (a, b) {
      return (b.id || 0) - (a.id || 0);
    }).slice(0, 5);

    if (!recents.length) {
      el.derniersInscrits.innerHTML = '<p class="journal-vide">Aucun etudiant enregistre.</p>';
      return;
    }

    el.derniersInscrits.innerHTML = '<div class="mini-liste">' + recents.map(function (etudiant) {
      return '<button class="mini-item" type="button" data-fiche="' + etudiant.id + '">'
        + '<span class="puce-nom" style="background:' + teinte(etudiant.nom) + '">' + echapper(initiales(etudiant)) + '</span>'
        + '<span>'
        + '<span class="mini-nom">' + echapper(etudiant.nomComplet || (etudiant.nom + ' ' + etudiant.prenom)) + '</span><br>'
        + '<span class="mini-meta">' + echapper(etudiant.filiere) + '</span>'
        + '</span>'
        + '<span class="mini-droite etiquette-filiere">#' + echapper(etudiant.id) + '</span>'
        + '</button>';
    }).join('') + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : tableau des etudiants                                       */
  /* ------------------------------------------------------------------ */

  function rendreTableau() {
    var liste = etat.filtree;
    el.navNombre.textContent = etat.etudiants.length;
    el.pastilleResultats.textContent = liste.length + (liste.length > 1 ? ' etudiants' : ' etudiant');

    if (!liste.length) {
      el.corpsTableau.innerHTML = '';
      el.tableau.hidden = true;
      el.tableauVide.hidden = false;
      return;
    }

    el.tableau.hidden = false;
    el.tableauVide.hidden = true;

    el.corpsTableau.innerHTML = liste.map(function (etudiant) {
      var annees = age(etudiant.dateNaissance);
      return '<tr>'
        + '<td>'
        + '<div class="cellule-etudiant">'
        + '<span class="puce-nom" style="background:' + teinte(etudiant.nom) + '">' + echapper(initiales(etudiant)) + '</span>'
        + '<span class="identite">'
        + '<strong>' + echapper(etudiant.nomComplet || (etudiant.nom + ' ' + etudiant.prenom)) + '</strong>'
        + '<small>Identifiant #' + echapper(etudiant.id) + (annees !== null ? ' · ' + annees + ' ans' : '') + '</small>'
        + '</span>'
        + '</div>'
        + '</td>'
        + '<td><span class="etiquette-filiere">' + echapper(etudiant.filiere) + '</span></td>'
        + '<td>' + formaterDate(etudiant.dateNaissance) + '</td>'
        + '<td class="cellule-email">' + echapper(etudiant.email) + '</td>'
        + '<td class="col-actions">'
        + '<div class="actions-ligne">'
        + '<button class="btn-ligne" type="button" data-fiche="' + etudiant.id + '" title="Voir la fiche" aria-label="Voir la fiche de ' + echapper(etudiant.nom) + '">'
        + '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 5c5 0 9 4.5 9 7s-4 7-9 7-9-4.5-9-7 4-7 9-7Zm0 2c-3.6 0-6.6 3.2-7 5 .4 1.8 3.4 5 7 5s6.6-3.2 7-5c-.4-1.8-3.4-5-7-5Zm0 1.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z" fill="currentColor"/></svg>'
        + '</button>'
        + '<button class="btn-ligne" type="button" data-modifier="' + etudiant.id + '" title="Modifier" aria-label="Modifier ' + echapper(etudiant.nom) + '">'
        + '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 17.2 15.4 5.8l2.8 2.8L6.8 20H4v-2.8ZM17 4.2l1.4-1.4a1 1 0 0 1 1.4 0l1.4 1.4a1 1 0 0 1 0 1.4L19.8 7 17 4.2Z" fill="currentColor"/></svg>'
        + '</button>'
        + '<button class="btn-ligne danger" type="button" data-supprimer="' + etudiant.id + '" title="Supprimer" aria-label="Supprimer ' + echapper(etudiant.nom) + '">'
        + '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 7h12v13H6V7Zm3-4h6l1 2h4v2H4V5h4l1-2Z" fill="currentColor"/></svg>'
        + '</button>'
        + '</div>'
        + '</td>'
        + '</tr>';
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : statistiques                                                */
  /* ------------------------------------------------------------------ */

  function rendreStatistiques() {
    var stats = etat.statistiques;
    if (!stats) { return; }

    var filieres = Object.keys(stats.repartitionParFiliere || {});
    var annees = stats.repartitionParAnneeNaissance || [];
    var effectifMax = annees.reduce(function (max, ligne) { return Math.max(max, ligne.nombreEtudiants); }, 0);

    el.cartesStats.innerHTML = [
      carte('Total etudiants', stats.totalEtudiants, 'table student', 'var(--teinte-1)'),
      carte('Filieres distinctes', stats.nombreFilieres, 'valeurs uniques', 'var(--teinte-3)'),
      carte('Annees de naissance', annees.length, 'GROUP BY YEAR(date_naissance)', 'var(--teinte-4)'),
      carte('Pic de la promotion', effectifMax, 'etudiants nes une meme annee', 'var(--teinte-5)')
    ].join('');

    var entreesFilieres = filieres
      .map(function (cle) { return { label: cle, valeur: stats.repartitionParFiliere[cle] }; })
      .sort(function (a, b) { return b.valeur - a.valeur; });

    var maxFiliere = entreesFilieres.reduce(function (max, entree) { return Math.max(max, entree.valeur); }, 0);
    rendreBarres(el.grapheFilieres, entreesFilieres, maxFiliere, true);

    if (!annees.length) {
      el.grapheAnnees.innerHTML = '<p class="journal-vide">Aucune annee disponible.</p>';
    } else {
      el.grapheAnnees.innerHTML = '<div class="graphe-colonnes">' + annees.map(function (ligne, index) {
        var hauteur = effectifMax > 0 ? Math.max(6, (ligne.nombreEtudiants / effectifMax) * 100) : 0;
        return '<div class="colonne">'
          + '<div class="colonne-barre" style="--barre-teinte:' + TEINTES[index % TEINTES.length] + '" data-hauteur="' + hauteur.toFixed(1) + '">'
          + '<span>' + ligne.nombreEtudiants + '</span>'
          + '</div>'
          + '<span class="colonne-label">' + echapper(ligne.annee) + '</span>'
          + '</div>';
      }).join('') + '</div>';
      animerBarres('#graphe-annees .colonne-barre');
    }

    rendreJournal();
  }

  function rendreJournal() {
    var lignes = Api.lireJournal();
    el.pastilleJournal.textContent = lignes.length + (lignes.length > 1 ? ' appels' : ' appel');

    if (!lignes.length) {
      el.journalApi.innerHTML = '<p class="journal-vide">Les appels apparaitront ici des la premiere requete.</p>';
      return;
    }

    el.journalApi.innerHTML = '<div class="journal">' + lignes.map(function (ligne) {
      var classe = ligne.methode.toLowerCase();
      var statut = ligne.statut === 0 ? 'échec' : ligne.statut;
      return '<div class="ligne-journal">'
        + '<span class="methode ' + classe + '">' + echapper(ligne.methode) + '</span>'
        + '<span class="chemin-journal">' + echapper(ligne.chemin) + '</span>'
        + '<span class="journal-droite">'
        + '<span class="statut-code ' + (ligne.ok ? 'ok' : 'ko') + '">' + echapper(statut) + '</span>'
        + '<span class="duree">' + ligne.duree + ' ms · ' + echapper(ligne.heure) + '</span>'
        + '</span>'
        + '</div>';
    }).join('') + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Chargement des donnees                                              */
  /* ------------------------------------------------------------------ */

  function chargerTout(afficherNotification) {
    etat.chargement = true;
    majEtatApi(false, 'Synchronisation...');
    el.etatApi.setAttribute('data-etat', 'attente');
    el.etatApi.querySelector('.etat-texte').textContent = 'Synchronisation...';

    return Promise.all([Api.lister(), Api.statistiques()])
      .then(function (resultats) {
        etat.etudiants = resultats[0] || [];
        etat.statistiques = resultats[1];
        appliquerFiltre();

        rendreIndicateurs();
        rendreMiniFilieres();
        rendreDerniersInscrits();
        rendreTableau();
        rendreStatistiques();

        majEtatApi(true, 'API connectee');
        if (afficherNotification) {
          notifier('succes', 'Donnees synchronisees', etat.etudiants.length + ' etudiants charges depuis l\'API.');
        }
      })
      .catch(function (erreur) {
        majEtatApi(false, 'API indisponible');
        notifier('erreur', 'Chargement impossible', erreur.message);
        el.cartesIndicateurs.innerHTML = '';
        el.miniFilieres.innerHTML = '<p class="journal-vide">Impossible de joindre l\'API.</p>';
        el.derniersInscrits.innerHTML = '<p class="journal-vide">Impossible de joindre l\'API.</p>';
      })
      .then(function () {
        etat.chargement = false;
      });
  }

  /* ------------------------------------------------------------------ */
  /* Recherche                                                           */
  /* ------------------------------------------------------------------ */

  function appliquerFiltre() {
    var terme = etat.recherche.trim().toLowerCase();
    if (!terme) {
      etat.filtree = etat.etudiants.slice();
      return;
    }
    etat.filtree = etat.etudiants.filter(function (etudiant) {
      var champs = [
        etudiant.nom,
        etudiant.prenom,
        etudiant.nomComplet,
        etudiant.filiere,
        etudiant.email,
        etudiant.dateNaissance
      ];
      return champs.some(function (valeur) {
        return String(valeur || '').toLowerCase().indexOf(terme) !== -1;
      });
    });
  }

  /**
   * La recherche combine un filtrage local immediat (reactivite) et l'endpoint
   * /students/search?nom= appele en differe, pour rester coherent avec l'API.
   */
  var rechercheDifferee = debounce(function (terme) {
    if (!terme.trim()) {
      etat.recherche = '';
      appliquerFiltre();
      rendreTableau();
      rendreJournal();
      return;
    }

    Api.rechercher(terme.trim())
      .then(function (resultats) {
        etat.recherche = terme;
        etat.filtree = resultats || [];
        if (etat.vue !== 'etudiants') { afficherVue('etudiants'); }
        rendreTableau();
        rendreJournal();
      })
      .catch(function (erreur) {
        notifier('erreur', 'Recherche impossible', erreur.message);
      });
  }, 320);

  function surRecherche(evenement) {
    var terme = evenement.target.value;
    etat.recherche = terme;
    el.rechercheEffacer.hidden = !terme;

    appliquerFiltre();
    rendreTableau();
    rechercheDifferee(terme);
  }

  function reinitialiserRecherche() {
    el.recherche.value = '';
    el.rechercheEffacer.hidden = true;
    etat.recherche = '';
    appliquerFiltre();
    rendreTableau();
  }

  /* ------------------------------------------------------------------ */
  /* Modales                                                             */
  /* ------------------------------------------------------------------ */

  function ouvrirModale(modale) {
    el.voile.hidden = false;
    modale.hidden = false;
    var premier = modale.querySelector('input, button:not([data-fermer])');
    if (premier) { premier.focus(); }
  }

  function fermerModales() {
    [el.modaleFormulaire, el.modaleFiche, el.modaleConfirmation].forEach(function (modale) {
      modale.hidden = true;
    });
    el.voile.hidden = true;
    etat.ficheCourante = null;
    etat.aSupprimer = null;
  }

  function viderErreurs() {
    Array.prototype.forEach.call(el.formulaire.querySelectorAll('.champ'), function (champ) {
      champ.classList.remove('invalide');
    });
    Array.prototype.forEach.call(el.formulaire.querySelectorAll('.erreur-champ'), function (paragraphe) {
      paragraphe.textContent = '';
    });
  }

  function signalerErreur(champ, message) {
    var conteneur = el.formulaire.querySelector('[name="' + champ + '"]');
    if (!conteneur) { return false; }
    var bloc = conteneur.closest('.champ');
    if (bloc) {
      bloc.classList.add('invalide');
      var zone = bloc.querySelector('[data-erreur="' + champ + '"]');
      if (zone) { zone.textContent = message; }
    }
    return true;
  }

  function ouvrirFormulaire(etudiant) {
    viderErreurs();
    el.formulaire.reset();

    if (etudiant) {
      el.titreModaleFormulaire.textContent = 'Modifier l\'etudiant #' + etudiant.id;
      el.formulaire.elements.nom.value = etudiant.nom || '';
      el.formulaire.elements.prenom.value = etudiant.prenom || '';
      el.formulaire.elements.dateNaissance.value = etudiant.dateNaissance || '';
      el.formulaire.elements.email.value = etudiant.email || '';
      el.formulaire.elements.filiere.value = etudiant.filiere || '';
      el.formulaire.dataset.id = etudiant.id;
    } else {
      el.titreModaleFormulaire.textContent = 'Nouvel etudiant';
      delete el.formulaire.dataset.id;
    }

    el.noteFormulaire.textContent = 'Les champs marques d\'un asterisque sont obligatoires.';
    ouvrirModale(el.modaleFormulaire);
  }

  var MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validerFormulaire(donnees) {
    var erreurs = 0;

    if (!donnees.nom.trim()) { signalerErreur('nom', 'Le nom est obligatoire.'); erreurs += 1; }
    else if (donnees.nom.trim().length > 60) { signalerErreur('nom', '60 caracteres maximum.'); erreurs += 1; }

    if (!donnees.prenom.trim()) { signalerErreur('prenom', 'Le prenom est obligatoire.'); erreurs += 1; }
    else if (donnees.prenom.trim().length > 60) { signalerErreur('prenom', '60 caracteres maximum.'); erreurs += 1; }

    if (!donnees.dateNaissance) {
      signalerErreur('dateNaissance', 'La date de naissance est obligatoire.');
      erreurs += 1;
    } else if (new Date(donnees.dateNaissance) >= new Date(new Date().toDateString())) {
      signalerErreur('dateNaissance', 'La date doit etre dans le passe.');
      erreurs += 1;
    }

    if (!donnees.email.trim()) { signalerErreur('email', "L'adresse e-mail est obligatoire."); erreurs += 1; }
    else if (!MOTIF_EMAIL.test(donnees.email.trim())) { signalerErreur('email', "L'adresse e-mail n'est pas valide."); erreurs += 1; }

    if (!donnees.filiere.trim()) { signalerErreur('filiere', 'La filiere est obligatoire.'); erreurs += 1; }

    return erreurs === 0;
  }

  function soumettreFormulaire(evenement) {
    evenement.preventDefault();
    viderErreurs();

    var donnees = {
      nom: el.formulaire.elements.nom.value.trim(),
      prenom: el.formulaire.elements.prenom.value.trim(),
      dateNaissance: el.formulaire.elements.dateNaissance.value,
      email: el.formulaire.elements.email.value.trim(),
      filiere: el.formulaire.elements.filiere.value.trim()
    };

    if (!validerFormulaire(donnees)) {
      notifier('erreur', 'Formulaire incomplet', 'Corrige les champs signales en rouge.');
      return;
    }

    var identifiant = el.formulaire.dataset.id;
    if (identifiant) { donnees.id = Number(identifiant); }

    el.btnEnregistrer.disabled = true;
    el.btnEnregistrer.textContent = 'Enregistrement...';

    Api.enregistrer(donnees)
      .then(function (cree) {
        notifier('succes', identifiant ? 'Etudiant mis a jour' : 'Etudiant enregistre',
          (cree && (cree.nomComplet || cree.nom)) + ' a bien ete enregistre.');
        fermerModales();
        return chargerTout(false);
      })
      .catch(function (erreur) {
        var champs = erreur.champsInvalides;
        if (champs) {
          Object.keys(champs).forEach(function (champ) { signalerErreur(champ, champs[champ]); });
        }
        notifier('erreur', 'Enregistrement refuse', erreur.message);
      })
      .then(function () {
        el.btnEnregistrer.disabled = false;
        el.btnEnregistrer.textContent = 'Enregistrer';
      });
  }

  /* ------------------------------------------------------------------ */
  /* Fiche et suppression                                                */
  /* ------------------------------------------------------------------ */

  function ouvrirFiche(id) {
    var etudiant = etat.etudiants.filter(function (candidat) {
      return String(candidat.id) === String(id);
    })[0];

    if (!etudiant) { return; }
    etat.ficheCourante = etudiant;

    var annees = age(etudiant.dateNaissance);
    el.titreModaleFiche.textContent = 'Fiche etudiant #' + etudiant.id;

    el.contenuFiche.innerHTML = '<div class="fiche-tete">'
      + '<span class="puce-nom" style="background:' + teinte(etudiant.nom) + '">' + echapper(initiales(etudiant)) + '</span>'
      + '<span>'
      + '<strong>' + echapper(etudiant.nomComplet || (etudiant.nom + ' ' + etudiant.prenom)) + '</strong>'
      + '<small>' + echapper(etudiant.filiere) + '</small>'
      + '</span>'
      + '</div>'
      + '<dl class="fiche-lignes">'
      + '<div class="fiche-ligne"><dt>Identifiant</dt><dd>#' + echapper(etudiant.id) + '</dd></div>'
      + '<div class="fiche-ligne"><dt>Nom</dt><dd>' + echapper(etudiant.nom) + '</dd></div>'
      + '<div class="fiche-ligne"><dt>Prenom</dt><dd>' + echapper(etudiant.prenom) + '</dd></div>'
      + '<div class="fiche-ligne"><dt>Date de naissance</dt><dd>' + formaterDate(etudiant.dateNaissance)
      + (annees !== null ? ' (' + annees + ' ans)' : '') + '</dd></div>'
      + '<div class="fiche-ligne"><dt>E-mail</dt><dd>' + echapper(etudiant.email) + '</dd></div>'
      + '<div class="fiche-ligne"><dt>Filiere</dt><dd>' + echapper(etudiant.filiere) + '</dd></div>'
      + '<div class="fiche-ligne"><dt>Annee de naissance</dt><dd>' + echapper(anneeNaissance(etudiant.dateNaissance)) + '</dd></div>'
      + '</dl>';

    ouvrirModale(el.modaleFiche);
  }

  function demanderSuppression(id) {
    var etudiant = etat.etudiants.filter(function (candidat) {
      return String(candidat.id) === String(id);
    })[0];
    if (!etudiant) { return; }

    etat.aSupprimer = etudiant;
    el.texteConfirmation.textContent = 'L\'etudiant ' + (etudiant.nomComplet || etudiant.nom)
      + ' (#' + etudiant.id + ') sera definitivement supprime de la base.';
    ouvrirModale(el.modaleConfirmation);
  }

  function confirmerSuppression() {
    if (!etat.aSupprimer) { return; }
    var cible = etat.aSupprimer;
    el.btnConfirmerSuppression.disabled = true;

    Api.supprimer(cible.id)
      .then(function () {
        notifier('succes', 'Etudiant supprime', (cible.nomComplet || cible.nom) + ' a ete retire de la base.');
        fermerModales();
        return chargerTout(false);
      })
      .catch(function (erreur) {
        notifier('erreur', 'Suppression impossible', erreur.message);
      })
      .then(function () {
        el.btnConfirmerSuppression.disabled = false;
      });
  }

  /* ------------------------------------------------------------------ */
  /* Export CSV                                                          */
  /* ------------------------------------------------------------------ */

  function exporterCsv() {
    var lignes = [['id', 'nom', 'prenom', 'dateNaissance', 'email', 'filiere']];

    etat.filtree.forEach(function (etudiant) {
      lignes.push([etudiant.id, etudiant.nom, etudiant.prenom, etudiant.dateNaissance, etudiant.email, etudiant.filiere]);
    });

    var contenu = lignes.map(function (ligne) {
      return ligne.map(function (valeur) {
        return '"' + String(valeur === null || valeur === undefined ? '' : valeur).replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\r\n');

    var blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
    var lien = document.createElement('a');
    lien.href = URL.createObjectURL(blob);
    lien.download = 'etudiants-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(lien.href);

    notifier('info', 'Export CSV genere', etat.filtree.length + ' lignes exportees.');
  }

  /* ------------------------------------------------------------------ */
  /* Horloge du pied de page                                             */
  /* ------------------------------------------------------------------ */

  function majHorloge() {
    var maintenant = new Date();
    var heure = String(maintenant.getHours()).padStart(2, '0');
    var minute = String(maintenant.getMinutes()).padStart(2, '0');
    var seconde = String(maintenant.getSeconds()).padStart(2, '0');
    el.piedHorloge.textContent = 'Derniere actualisation ' + heure + ':' + minute + ':' + seconde;
  }

  /* ------------------------------------------------------------------ */
  /* Initialisation                                                      */
  /* ------------------------------------------------------------------ */

  function brancherEvenements() {
    Array.prototype.forEach.call(document.querySelectorAll('.nav-item[data-vue]'), function (lien) {
      lien.addEventListener('click', function (evenement) {
        evenement.preventDefault();
        afficherVue(lien.getAttribute('data-vue'));
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-vue-lien]'), function (bouton) {
      bouton.addEventListener('click', function () {
        afficherVue(bouton.getAttribute('data-vue-lien'));
      });
    });

    el.burger.addEventListener('click', function () {
      el.sidebar.classList.toggle('ouverte');
    });

    el.voile.addEventListener('click', fermerModales);

    Array.prototype.forEach.call(document.querySelectorAll('[data-fermer]'), function (bouton) {
      bouton.addEventListener('click', fermerModales);
    });

    document.addEventListener('keydown', function (evenement) {
      if (evenement.key === 'Escape') {
        fermerModales();
        fermerSidebar();
      }
    });

    el.recherche.addEventListener('input', surRecherche);
    el.rechercheEffacer.addEventListener('click', reinitialiserRecherche);
    el.btnReinitFiltre.addEventListener('click', reinitialiserRecherche);

    el.btnAjouter.addEventListener('click', function () { ouvrirFormulaire(null); });
    el.formulaire.addEventListener('submit', soumettreFormulaire);

    el.btnExport.addEventListener('click', exporterCsv);
    el.btnConfirmerSuppression.addEventListener('click', confirmerSuppression);

    el.btnSupprimerFiche.addEventListener('click', function () {
      if (etat.ficheCourante) {
        var id = etat.ficheCourante.id;
        el.modaleFiche.hidden = true;
        demanderSuppression(id);
      }
    });

    el.theme.addEventListener('click', function () {
      var sombre = document.documentElement.getAttribute('data-theme') !== 'sombre';
      appliquerTheme(sombre);
      if (etat.vue === 'statistiques') { rendreStatistiques(); }
    });

    document.addEventListener('click', function (evenement) {
      var cible = evenement.target.closest('[data-fiche], [data-supprimer], [data-modifier]');
      if (!cible) { return; }
      if (cible.hasAttribute('data-fiche')) { ouvrirFiche(cible.getAttribute('data-fiche')); }
      else if (cible.hasAttribute('data-supprimer')) { demanderSuppression(cible.getAttribute('data-supprimer')); }
      else if (cible.hasAttribute('data-modifier')) {
        var id = cible.getAttribute('data-modifier');
        var etudiant = etat.etudiants.filter(function (candidat) {
          return String(candidat.id) === String(id);
        })[0];
        if (etudiant) { ouvrirFormulaire(etudiant); }
      }
    });

    window.addEventListener('hashchange', function () {
      afficherVue((window.location.hash || '#tableau').replace('#', ''));
    });
  }

  function memoriserElements() {
    el = {
      sidebar: $('sidebar'),
      burger: $('burger'),
      voile: $('voile'),
      titreVue: $('titre-vue'),
      sousTitreVue: $('sous-titre-vue'),
      recherche: $('recherche'),
      rechercheEffacer: $('recherche-effacer'),
      theme: $('theme'),
      btnAjouter: $('btn-ajouter'),
      navNombre: $('nav-nombre'),
      etatApi: $('etat-api'),
      cartesIndicateurs: $('cartes-indicateurs'),
      miniFilieres: $('mini-filieres'),
      derniersInscrits: $('derniers-inscrits'),
      pastilleFilieres: $('pastille-filieres'),
      pastilleResultats: $('pastille-resultats'),
      tableau: $('tableau-etudiants'),
      corpsTableau: $('corps-tableau'),
      tableauVide: $('tableau-vide'),
      btnReinitFiltre: $('btn-reinit-filtre'),
      btnExport: $('btn-export'),
      cartesStats: $('cartes-stats'),
      grapheFilieres: $('graphe-filieres'),
      grapheAnnees: $('graphe-annees'),
      journalApi: $('journal-api'),
      pastilleJournal: $('pastille-journal'),
      piedHorloge: $('pied-horloge'),
      toasts: $('toasts'),
      modaleFormulaire: $('modale-formulaire'),
      titreModaleFormulaire: $('titre-modale-formulaire'),
      formulaire: $('formulaire'),
      noteFormulaire: $('note-formulaire'),
      btnEnregistrer: $('btn-enregistrer'),
      modaleFiche: $('modale-fiche'),
      titreModaleFiche: $('titre-modale-fiche'),
      contenuFiche: $('contenu-fiche'),
      btnSupprimerFiche: $('btn-supprimer-fiche'),
      modaleConfirmation: $('modale-confirmation'),
      texteConfirmation: $('texte-confirmation'),
      btnConfirmerSuppression: $('btn-confirmer-suppression')
    };
  }

  function demarrer() {
    memoriserElements();
    initialiserTheme();
    brancherEvenements();

    var depart = (window.location.hash || '#tableau').replace('#', '');
    afficherVue(TITRES[depart] ? depart : 'tableau');

    majHorloge();
    setInterval(majHorloge, 1000);

    chargerTout(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
