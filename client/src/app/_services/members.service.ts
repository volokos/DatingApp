import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {of, pipe} from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LikesParams } from '../_models/likesParams';
import { Member } from '../_models/member';
import { PaginatedResult } from '../_models/pagination';
import { User } from '../_models/user';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';



@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  memberCash = new Map();
  user: User;
  userParams: UserParams;
  likesParams: LikesParams;


  constructor(private http: HttpClient, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
    this.user = user;
    this.userParams = new UserParams(user);
    this.likesParams = new LikesParams();
    });
  }

  getUserParams() {
    return this.userParams;
  }

  setUserParams(params: UserParams) {
    this.userParams = params;
  }

  resetUserParams() {
    this.userParams = new UserParams(this.user);
    return this.userParams;
  }

  getLikesParams() {
    return this.likesParams;
  }

  setLikesParams(params: LikesParams) {
    this.likesParams = params;
  }

  getMembers(userParams: UserParams) {
    let response = this.memberCash.get(Object.values(userParams).join('-'));
    if (response) {
      return of(response);
    }
    let params = getPaginationHeaders(userParams.pageNumber, userParams.pageSize);

    params = params.append('minAge', userParams.minAge.toString());
    params = params.append('maxAge', userParams.maxAge.toString());
    params = params.append('gender', userParams.gender);
    params = params.append('orderBy', userParams.orderBy);

    return getPaginatedResult<Member[]>(this.baseUrl + 'users', params, this.http)
      .pipe(map(response => {
        this.memberCash.set(Object.values(userParams).join('-'), response);
        return response;
      }));
  }



  getMember(username: string) {
    const member = [...this.memberCash.values()]
      .reduce((arr, elem) => arr.concat(elem.result), [])
      .find((member: Member) => member.username === username);
    if (member)
      { return of(member); }
    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + 'users/', member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = member;
      })
    );
  }

  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }



   addLike(username: string) {
     return this.http.post(this.baseUrl + 'likes/' + username, {});
   }

   getLikes(likesParams: LikesParams) {
     let params = getPaginationHeaders(likesParams.pageNumber, likesParams.pageSize);
     params = params.append('predicate', likesParams.predicate);
     return getPaginatedResult<Partial<Member[]>>(this.baseUrl + 'likes', params, this.http);
   }

}
