import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MainService } from '../_core/services/main.service';
import { OrderHttpService }  from '../_core/services/order-http.service';
import { EditModeGlobalVisibilityService }  from '../_core/services/editmode-global-visibility.service';
import { IOrderGlasses, IGlassesVoucher, IPrice } from '../_core/models/order-glasses.model';
import * as cloneDeep from 'lodash/cloneDeep';

@Component({
  selector: 'glasses-voucher',
  templateUrl: './glasses-voucher.component.html',
  encapsulation: ViewEncapsulation.None
})
export class GlassesVoucherComponent {
	static readonly COMPONENT_NAME: string = "GlassesVoucherComponent";
	public isVisibleGlobal: boolean = true;
	public isVisible: boolean = false;
	public inEditMode: boolean = false;
	public orderGlasses: IOrderGlasses;

	public vouchers: Array<any>;
	public vouchersForDelete: Array<any>;
	public commonPricesHelper: Array<number> = [
		252,
		312,
		372,
		402,
		462,
		504,
		522,
		593,
		744
	];

	constructor(private fb: FormBuilder,
		private mainService: MainService,
		private orderHttpService: OrderHttpService,
		private editModeGlobalVisibility: EditModeGlobalVisibilityService) {
			this.vouchers = [];
			this.vouchersForDelete = [];
	}

	ngOnInit(): void {
		this.editModeGlobalVisibility.watch(v => {
			this.isVisibleGlobal = (v.name && v.name != GlassesVoucherComponent.COMPONENT_NAME) ? false : true;
			if(v.name != GlassesVoucherComponent.COMPONENT_NAME) this.inEditMode = false;
		});

		this.mainService.orderChanged((v) => {
			this.orderGlasses = v;
			this._initializeValues(v);
		});

		this.vouchersForDelete = [];
	}

	private _initializeValues(order: IOrderGlasses): void {
		if(order) {
			this.vouchers = cloneDeep(order.vouchers);
			if(!this.vouchers.length) {
				this.vouchers = [];
				this.addVoucher(null);
			}

			if(order.glassesType && order.lensesOption) this.isVisible = true;
		}
	}

	/** save form */
    save(): void {
		for(let i=this.vouchers.length-1; i>=0; i--) {
			if(this.vouchers[i].totalPrice.amount < 1) {
				// add to remove queue
				if(this.vouchers[i].id !== null) {
					this.vouchersForDelete.push(this.vouchers[i]);
				}
				this.vouchers.splice(i, 1);
			}
		}

		this.orderGlasses.vouchers = this.vouchers;
		this.orderHttpService.changeGlassesVouchers(this.orderGlasses, this.vouchersForDelete).subscribe(
			result => {
				this.inEditMode = false;
				this.mainService.setNewValue(result);
				this.editModeGlobalVisibility.clear();
			},
			error => {
				alert('Vyskytla se chyba.');
			});
    }

	/** edit form */
    editMode(): void {
		this.inEditMode = true;
		this.editModeGlobalVisibility.toEdit(GlassesVoucherComponent.COMPONENT_NAME);
		this._initializeValues(this.orderGlasses);
	}
	
	/** back button */
	goBack(): void {
		this.inEditMode = false;
		this.editModeGlobalVisibility.clear();
	}

	/** add new voucher */
	addVoucher(ev: any): void {
		if(this.vouchers.length >= 4) return;
		this.vouchers.push(<IGlassesVoucher>{
			id: null,
			totalPrice: <IPrice>{
				amount: null,
				currency: 0
			}
		});
	}

	/** remove existing voucher */
	removeVoucher(el: any, id: string, index: number): void {
		let voucher = id === null
			? this.vouchers[index]
			: this.vouchers.find(v => v.id == id);

		// add to remove queue
		if(voucher.id !== null) {
			this.vouchersForDelete.push(voucher);
		}

		this.vouchers.splice(index, 1);
	}

	/** set new voucher value | value can be number or element */
	setValue(el: any, id: string, index: number): void {
		let value = (isNaN(el)) ? el.target.value : el;
		if(value == '') {
			this.removeVoucher(null, id, index);
			return;
		}
		let voucher = id === null
			? this.vouchers[index]
			: this.vouchers.find(v => v.id == id);
		voucher.totalPrice.amount = parseFloat(value);
	}

	getAppliedVouchersCount(): number {
		return this.vouchers.filter(v => v.id !== null).length;
	}
}