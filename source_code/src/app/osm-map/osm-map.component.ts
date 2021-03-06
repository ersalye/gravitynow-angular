import { Component, OnInit, HostListener, Input, Injectable } from '@angular/core';
import { Gravity } from '../classes/gravity';
import { OsmMessageServiceService } from '../services/osm-message-service.service';
import { OsmLocation } from '../classes/osm-location';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

// declare variable
declare let L;

@Component({
  selector: 'app-osm-map',
  templateUrl: './osm-map.component.html',
  styleUrls: ['./osm-map.component.css']
})

export class OsmMapComponent implements OnInit {

  static map: any;

  mapHeight: number;
  imgMarginTop: number;
  imgMarginLeft: number;
  gravityResult: string = "G";
  currentLocation: Observable<OsmLocation>;
  osmLocationSubject$ = this.service.osmLocationSubject$;

  constructor(private service: OsmMessageServiceService, private translateService: TranslateService){ }

  @HostListener('window:resize')
  onWindowResize() {
    this.resizeMap();
  }

  resizeMap() {
    let mapHeight = document.body.clientHeight - (document.getElementById("titleBar").clientHeight + document.getElementById("footer").clientHeight);

    this.imgMarginTop = mapHeight - 89;
    this.imgMarginLeft = (document.body.clientWidth / 2) - 89;
    this.mapHeight = mapHeight;
  }
  
  setNewMarker(loc, translations){
    new Gravity().getAltitude(parseFloat(loc[0]),parseFloat(loc[1])).then(function(result){
      let markerIcon = new L.DivIcon({
        className: 'my-div-icon',
        html: `<img style="height:32px;width:23.5px" class="my-div-image" src="assets/img/Map_pin_icon.svg"/>
                  <span class="my-div-span">${new Gravity().GetGravity(result.elevations[0].lat, result.elevations[0].elevation).toFixed(4)}m/s²</span>`
      });
      new L.marker(loc, { icon: markerIcon }).bindTooltip(`${translations.Latitude}: ${result.elevations[0].lat.toFixed(2)}°, ${translations.Longitude}: ${result.elevations[0].lon.toFixed(2)}°, ${translations.Altitude}: ${result.elevations[0].elevation}m`).addTo(OsmMapComponent.map);
    });
  }

  ngOnInit() {
    this.service.osmLocationSubject$.subscribe(value => { 
      if (value.lat != undefined && value.lon != undefined){
        this.setNewMarker([value.lat,value.lon], this.translateService.store.translations[`${this.translateService.defaultLang}`]); 
        OsmMapComponent.map.setView([value.lat,value.lon], 4);
      }
    });

    let curLocation = [];
    //El Salvador
    curLocation = [13.905190, -89.500206];      

    OsmMapComponent.map = L.map('map').setView(curLocation, 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(OsmMapComponent.map);

    L.control.locate().addTo(OsmMapComponent.map);
    OsmMapComponent.map.attributionControl.setPrefix(false);

    let markerIcon = L.icon({
      iconUrl: 'assets/img/Map_pin_icon_green.svg',
      iconSize: [94 / 3, 128 / 3], // size of the icon
    });

    let marker = new L.marker(curLocation, {
      icon: markerIcon,
      draggable: 'true'
    });

    marker.on('dragend', this.dragMarker);

    OsmMapComponent.map.addLayer(marker);

    OsmMapComponent.map.on('click', e => this.setNewMarker([e.latlng.lat, e.latlng.lng], this.translateService.store.translations[`${this.translateService.defaultLang}`]));

    OsmMapComponent.map.on('locationfound', e => this.setNewMarker([e.latlng.lat, e.latlng.lng], this.translateService.store.translations[`${this.translateService.defaultLang}`]));
    this.resizeMap();
  }

  dragMarker(event:any) {
    // @ts-ignore
    let position = this.getLatLng();
    // @ts-ignore
    this.setLatLng(position, {
      draggable: 'true'
    }).bindPopup(position).update();

    new Gravity().getAltitude(position.lat,position.lng).then(function(result){
      return new Gravity().GetGravity(result.elevations[0].lat, result.elevations[0].elevation).toFixed(2);
    }).then(gResult =>{
      this.gravityResult = gResult;
      document.getElementById("lblGravity").innerHTML = `${gResult}`;
      document.getElementById("lblGUnit").innerHTML = `m/s²`;
    });
  }
}