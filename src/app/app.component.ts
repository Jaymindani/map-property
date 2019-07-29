import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'map-property';
  public data: any;
  public propertyData;
  public resdType;
  public streets;
  public minPrice: number = 0;
  public maxPrice: number = 0;
  lat = 51.678418;
  lng = 7.809007;
  percentColors = [
    { pct: 0.1, color: { r: 0xff, g: 0x00, b: 0 } },
    { pct: 0.7, color: { r: 0xff, g: 0xff, b: 0 } },
    { pct: 1.0, color: { r: 0x00, g: 0xff, b: 0 } }];
  constructor() {
    this.propertyData = [];
    this.resdType = [];
    this.streets = [];
  }

  convertExcelToJson(file) {
    console.log('convertexceltojson');
  }

  onFileChange(evt: any) {
    /* wire up file reader */
    const target: DataTransfer = (evt.target) as DataTransfer;
    if (target.files.length !== 1) { throw new Error('Cannot use multiple files'); }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = (XLSX.utils.sheet_to_json(ws, { header: 1 }));
      const objectKeys = _.head(this.data);
      this.data.slice(1).forEach((jsonElement) => {
        const propertyEntity = {};
        let i = 0;
        jsonElement.forEach(element => {
          propertyEntity[objectKeys[i]] = _.trim(element);
          i = i + 1;
        });
        this.propertyData.push(propertyEntity);
      });
      console.log('data ', this.propertyData);
      this.lat = Math.abs(_.minBy(this.propertyData, (o: any) => o.Latitude).Latitude);
      this.lng = Math.abs(_.maxBy(this.propertyData, (o: any) => o.Longitude).Longitude);
      const maxValue = _.maxBy(this.propertyData, (o: any) => o.ESTIMATED_MARKET_VALUE).ESTIMATED_MARKET_VALUE;
      console.log('max property value', maxValue);
      this.propertyData.forEach((property) => {
        property.Latitude = Math.abs(property.Latitude);
        property.Longitude = Math.abs(property.Longitude);
        property.radius = 12;
        property.color = this.getColorForPercentage((property.ESTIMATED_MARKET_VALUE / maxValue) * 100);
      });
      this.resdType = _.filter(_.map(_.uniqBy(this.propertyData, (o: any) => o.RES_TYPE), (o: any) => o.RES_TYPE), (o) => !_.isEmpty(o));
      this.streets = _.filter(_.map(_.uniqBy(this.propertyData, (o: any) => o.STREET), (o: any) => o.STREET), (o) => !_.isEmpty(o));
      console.log('lat long', this.resdType);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  getColorForPercentage(pct) {
    for (let i = 1; i < this.percentColors.length - 1; i++) {
      if (pct < this.percentColors[i].pct) {
        break;
      }
    }
    const lower = this.percentColors[0];
    console.log('lower color', lower);
    const upper = this.percentColors[2];
    const range = upper.pct - lower.pct;
    const rangePct = (pct - lower.pct) / range;
    const pctLower = 1 - rangePct;
    const pctUpper = rangePct;
    const color = {
      r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
      g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
      b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
    };
    return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
    // or output as hex if preferred
  }

  onResidenceChange(event) {
    console.log('on residence change', event.source.value);
    this.propertyData = _.filter(this.propertyData, (o) => o.RES_TYPE === event.source.value);
  }

  onStreetChange(event) {
    console.log('on street change', event.source.value);
    this.propertyData = _.filter(this.propertyData, (o) => o.STREET === event.source.value);
  }

  onFilterPriceClick() {
    console.log('min price and max price', this.minPrice, this.maxPrice);
    this.propertyData = _.filter(this.propertyData, (o) => o.ESTIMATED_MARKET_VALUE >= this.minPrice
                                 && o.ESTIMATED_MARKET_VALUE <= this.maxPrice);
  }
}
