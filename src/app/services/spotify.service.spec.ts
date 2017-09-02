import { TestBed, inject, fakeAsync, tick } from "@angular/core/testing";
import { MockBackend } from "@angular/http/testing";
import {
  Http,
  BaseRequestOptions,
  Response,
  ResponseOptions
} from "@angular/http";

import { SpotifyService } from "./spotify.service";

describe("SpotifyService", () => {
  let spotifyService: SpotifyService;
  let spotifyBackend: MockBackend;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SpotifyService,
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          useFactory: (backend, options) => new Http(backend, options),
          deps: [
            MockBackend,
            BaseRequestOptions
          ]
        }
      ]
    });

    spotifyService = TestBed.get(SpotifyService);
    spotifyBackend = TestBed.get(MockBackend);
  });

  it("should be created", inject([SpotifyService],
    (service: SpotifyService) => {
    expect(service).toBeTruthy();
  }));

  it("should calculate delta time in seconds between two dates", () => {
    const today = new Date("9/2/2017");
    const yesterday = new Date("9/1/2017");
    expect(spotifyService.deltaTimeInSeconds(today, yesterday))
      .toBe(24 * 60 * 60);
  });

  it("should refresh access token if past 3600 seconds", () => {
    spotifyService.accessTokenDateTime = new Date("9/1/2017");
    spyOn(spotifyService, "authorize").and.callThrough();
    spotifyService.refreshAccessToken();
    expect(spotifyService.authorize).toHaveBeenCalled();
  });

  it("should not refresh access token if not past 3600 seconds", () => {
    spotifyService.accessTokenDateTime = new Date;
    spyOn(spotifyService, "authorize").and.callThrough();
    spotifyService.refreshAccessToken();
    expect(spotifyService.authorize).not.toHaveBeenCalled();
  });

  it("should be able to authorize", () => {
    let request;
    let requestBody;
    let response;

    spotifyBackend.connections.subscribe(connection => {
      request = connection.request;
      requestBody = connection.request.json();

      expect(request.url)
        .toBe("https://accounts.spotify.com/api/token");
      expect(request.headers.get("Content-Type"))
        .toBe("application/x-www-form-urlencoded");
      expect(request.headers.get("Authorization"))
        .toMatch(/Basic ZjIyYTNlYT/);
      expect(requestBody.grant_type)
        .not.toBeNull();
      expect(requestBody.grant_type)
        .toBe("client_credentials");

      connection.mockRespond(new Response(<ResponseOptions> {
        body: JSON.stringify({
          access_token: "12345",
          token_type: "bearer",
          expires_in: 3600
        })
      }));
    });

    spotifyService.authorize()
      .subscribe(res => {
        response = res.json();
      });

    expect(response.access_token).toBe("12345");
    expect(response.token_type).toBe("bearer");
    expect(response.expires_in).toBe(3600);
  });

  it("should be able to search tracks", () => {
    let request;
    let requestBody;
    let response;

    spotifyBackend.connections.subscribe(connection => {
      request = connection.request;
      requestBody = connection.request.json();

      expect(spotifyService.accessToken).toBe("12345");
      expect(request.url)
        .toMatch(/api.spotify.com\/v1\/search\?q\=u2\&type\=track/);
      expect(request.headers.get("Content-Type"))
        .toBe("application/json");
      expect(request.headers.get("Authorization"))
        .toBe("Bearer 12345");

      connection.mockRespond(new Response(<ResponseOptions> {
        body: JSON.stringify({
          tracks: {
            items: [
              {
                album: {
                  artists: [
                    {
                      name: "Kendrick Lamar",
                      type: "artist",
                    }
                  ],
                  name: "DAMN.",
                },
              },
            ]
          }
        })
      }));
    });

    spyOn(spotifyService, "authorize").and.callThrough();

    spotifyService.accessToken = "12345";
    spotifyService.accessTokenDateTime = new Date;
    spotifyService.searchTrack("u2").subscribe(res =>  response = res);

    expect(spotifyService.authorize).not.toHaveBeenCalled();
    expect(response.tracks.items.length).toEqual(1);
    expect(response.tracks.items[0].album.artists[0].name)
      .toBe("Kendrick Lamar");
    expect(response.tracks.items[0].album.name).toBe("DAMN.");
  });
});
