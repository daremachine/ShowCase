import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import CryptoJS from 'crypto-js';

import { IOrderGlasses, IGlassesFrame, IPrice, IGlassesRefraction } from '../models/order-glasses.model';
import { IDataList } from '../models/global-datalists.model';
import { AppUrlEnum } from '../enums/app-init-config.enums';

// configuration
export enum Configuration {
    CR_K = 'zt19vYR0'  
}

export interface IAppInitConfig {
    urls: object[];
    contractId: string;
    // ComponentModeEnum
    componentMode: string;
    getUrl(key: AppUrlEnum): string;
}

export interface IAppUrl {
    key: string;
    value: string;
}

export class AppInitConfig implements IAppInitConfig {
    urls: IAppUrl[] = [];
    contractId: string;
    
    // ComponentModeEnum
    componentMode: string;

    constructor(urls: IAppUrl[], contractId: string, componentMode: string) {
        this.urls = urls;
        this.componentMode = componentMode;
        this.contractId = contractId;
    }

    /**
     * Get url from list by url key enum
     * @method getUrl
     * @param key AppUrlEnum
     */
    getUrl(key: AppUrlEnum): string {
        const url = this.urls.find(v => v.key == AppUrlEnum[key]);
        return url == null ? "not_found" : url.value;
    }
}


@Injectable()
export class MainService {
    public orderGlasses$: Observable<IOrderGlasses>;
    private _orderGlasses$: BehaviorSubject<IOrderGlasses>;
    public orderGlasses: IOrderGlasses;

    public globalDataLists$: Observable<IDataList>;
    private _globalDataLists$: BehaviorSubject<IDataList>;
    public globalDataLists: IDataList;

    public appInitConf$: Observable<IAppInitConfig>;
    private _appInitConf$: BehaviorSubject<IAppInitConfig>;
    public appInitConf: IAppInitConfig;

    constructor() {
        this.orderGlasses = <IOrderGlasses>{};
        this.orderGlasses.glassesFrame = <IGlassesFrame>{};
        this.orderGlasses.glassesFrame.price = <IPrice>{};
        this.orderGlasses.refraction = <IGlassesRefraction>{};
        this.orderGlasses.vouchers = [];
        
        this._orderGlasses$ = <BehaviorSubject<IOrderGlasses>>new BehaviorSubject(this.orderGlasses);
        this.orderGlasses$ = this._orderGlasses$.asObservable();

        this.globalDataLists = null;
        this._globalDataLists$ = <BehaviorSubject<IDataList>>new BehaviorSubject(this.globalDataLists);
        this.globalDataLists$ = this._globalDataLists$.asObservable();

        this._appInitConf$ = <BehaviorSubject<IAppInitConfig>>new BehaviorSubject(null);
        this.appInitConf$ = this._appInitConf$.asObservable();
    }

    encr1pt(str): string {
        return CryptoJS.AES.encrypt(str, Configuration.CR_K).toString();
    }

    /**
     * @method orderChanged
     * @param {Function} callback defined in subscribe
     */
    orderChanged(callback): void {
        this.orderGlasses$.subscribe(callback);
    }

    /**
     * @method get
     */
    getOrder(): IOrderGlasses {
        return this._orderGlasses$.getValue();
    }

    /**
     * @method setNewValue
     * @param orderGlasses
     */
    setNewValue(orderGlasses): void {
        this._orderGlasses$.next(orderGlasses);
    }

    /**
     * @method setDataLists
     * @param dataList
     */
    setDataLists(dataList): void {
        this._globalDataLists$.next(dataList);
    }

    /**
     * @method getDataList
     */
    getDataList(): IDataList {
        return this._globalDataLists$.getValue();
    }

    /**
     * @method orderChanged
     * @param {Function} callback defined in subscribe
     */
    watchDataList(callback): void {
        this.globalDataLists$.subscribe(callback);
    }

    /**
     * Set app initialization configuration
     * @param config
     */
    setAppInitConfig(config: IAppInitConfig): void {
        this._appInitConf$.next(config);
    }

    /**
     * Get app initialization configuration 
     * @param callback
     */
    getAppInitConfig(callback): void {
        this.appInitConf$.subscribe(callback);
    }
}