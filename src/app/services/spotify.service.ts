import { Injectable } from '@angular/core';
import { Http, Headers } from "@angular/http";
import { Observable } from "rxjs/Rx";
import "rxjs/add/operator/map";

import { environment } from "../../environments/environment";

@Injectable()
export class SpotifyService {
  private _SPOTIFY_CLIENT_ID: string = environment.SPOTIFY_CLIENT_ID;
  private _SPOTIFY_CLIENT_SECRET: string = environment.SPOTIFY_CLIENT_SECRET;
  private _accessToken: string;
  private _accessTokenDateTime: Date;

  constructor(private _http: Http) { }

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(accessToken: string) {
    this._accessToken = accessToken;
  }

  get accessTokenDateTime() {
    return this._accessTokenDateTime;
  }

  set accessTokenDateTime(dateTime: Date) {
    this._accessTokenDateTime = dateTime;
  }

  refreshAccessToken() {
    const seconds =
      this.deltaTimeInSeconds(new Date, this._accessTokenDateTime);
    if (seconds >= 3600) {
      this.authorize().subscribe(
        res => {
          this._accessToken = res.json().access_token;
          this._accessTokenDateTime = new Date;
        },
        err => console.log(err)
      );
    }
  }

  deltaTimeInSeconds(present: Date, past: Date) {
    const timeDiff = Math.abs(present.getTime() - past.getTime());
    return Math.ceil(timeDiff / 1000);
  }

  authorize() {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("Authorization", "Basic " +
      btoa(`${this._SPOTIFY_CLIENT_ID}:${this._SPOTIFY_CLIENT_SECRET}`));
    const body: Object = { grant_type: "client_credentials" };
    const authorizationURL: string = "https://accounts.spotify.com/api/token";
    return this._http.post(authorizationURL, body, { headers: headers });
  }

  searchTrack(query: string) {
    this.refreshAccessToken();
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${this._accessToken}`);
    const params: string = [
      `q=${query}`,
      `type=track`,
    ].join("&");
    const queryURL: string = `https://api.spotify.com/v1/search?${params}`;
    return this._http.get(queryURL, { headers: headers })
      .map(res => res.json());
  }
}
