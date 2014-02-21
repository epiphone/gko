# GKO harjoitustyön suunnitelma

Aleksi Pekkala (aleksi.v.a.pekkala@student.jyu.fi)

21.2.2014

## Ohjelman kuvaus

Tarkoituksena on toteuttaa läjä web-pohjaisia komponentteja, joista voidaan muodostaa peruskoululaisille suunnattuja - erityisesti matematiikan - tehtäviä. Komponenttien on oltava sen verran fiksuja, että kaikista yksinkertaisimpien tehtävien toteuttamiseen ei tarvita kuin yksi HTML-tiedosto. Esimerkiksi yhteenlaskutehtävä voisi näyttää jotakuinkin tällaiselta:

```html
<div ng-init="a = random(10); b = random(10)"> <!-- Arvotaan muuttujat -->
  <math>{{a}} + {{b}} = ?</math> <!-- Math-tagien sisälle voidaan upottaa Latex-notaatioa -->
  <input ng-model="answer"/> <!-- Syötetty vastaus kaapataan answer-muuttujaan -->
  <button ng-click="checkAnswer(answer, a + b)">Tarkista</button> <!--checkAnswer-funktion parametreja ovat käyttäjän vastaus sekä oikea vastaus   -->
</div>
```

Tarvittaessa tehtävään voidaan liittää oma kontrolleri (javascript-moduuli), jolloin tehtävä voi olla laajempi. 



## Tavoitetaso

Ohjelman tavoitetaso on 3: ominaisuuksia ovat ainakin
* selvästi käyttöliittymältään vaativampi ja/tai laajempi aihe
* hyödyllinen ja yleiskäyttöinen komponentti jota voidaan käyttää muuallakin kuin vain tässä ohjelmassa
* piirtäminen ja animointi (koordinaatistotehtäviä varten)
* yhteensopivuus mobiililaitteiden kanssa

Lisäksi komponenttien tulee olla sen verran hiottuja, että niitä voidaan käyttää osana laajempaa olemassaolevaa järjestelmää. Komponenteilla luotujen tehtävien tulee myös olla testattavissa yksikkötesteillä.

## Komponentit

Laajin yksittäinen komponentti on 2d-koordinaatisto, jonka sisälle voidaan piirtää erilaisia kappaleita. Koordinaatisto toteutetaan SVG-grafiikalla d3-kirjastoa hyödyntäen. Koordinaatistoa voidaan käyttää esimerkiksi tehtäviin, joissa tunnistetaan kappaleita tai lasketaan lukumääriä sekä pinta-aloja. Eventin laukaisee ainakin koordinaatistolle piirretyn kappaleen klikkaus. Koordinaatisto on mahdollisesti myös zoomattavissa.

Toinen tärkeä komponentti on elementti jonka sisälle voidaan upottaa Latexin matematiikka-notaatiota. Komponentti hyödyntää MathJax-kirjastoa matemaattisten merkkien renderöintiin. Muita komponentteja ovat ainakin validoitava input sekä jonkinlaiset elementit monivalintatehtäviä sekä fill in the blank-tyylisiä tehtäviä varten.

## Aikataulu

**21.2.** Suunnitelma
**28.2.** Koordinaatisto toimii
**7.3.** Toiminnallisuudet valmiina eli tehtäviä voi luoda 
** 13.3. ** Koko työ on valmis
