window.addEventListener('load', () => {
    const mainBtn = document.querySelector('#mainBtn');
    mainBtn.onclick = () => {
        const boiler = new Boiler('TP-220')
        boiler.initParams()
        boiler.getCompleteVolumeAir();
        boiler.getIntalpOfProducts();
        boiler.getThermalBalanceOfTheBoilerUnit();
        boiler.getSizingOfTheFurnance();
        boiler.getCalculationOfTheFurnaceGasTemperature();


        console.log('====================================');
        console.log(boiler);
        console.log('====================================');


        $('.block_container .block_subcontainer').slideUp(0)
        boiler.output.onclick = (e) => {
            const target = e.target;
            if (target.matches('.block_title')) {
                $(target).siblings('.block_subcontainer').slideToggle(300)
            }
        }
    }

    $('[type="text').on('input', (e) => {
        let input = e.target;
        input.value = input.value.replace(/[^0-9.]/g, '')
    })

    $('.type_of_fuel input').on('change', function () {
        let fuelType = $(this).val();
        $('[data-change]').hide();

        if (fuelType == 'mix') {
            $('[data-change]').fadeIn(500);
        } else {
            $(`[data-change=${fuelType}]`).fadeIn(500);
        }
    })

    $('#convectiveAdd').on('click', function () {
        $('.modal_page').fadeIn(300)
    })

    $('#acessConvective').on('click', function () {
        let conectiveForm = $('.hidden_serv').find(`[data-target=${$('#convectipeType').val()}]`).clone();

        conectiveForm.find('form').removeAttr('data-copy')

        conectiveForm.appendTo('.convective_bloks');
        $('.modal_page').fadeOut(300)
    })

    $('.modal_page').on('click', function (e) {
        let target = e.target.closest('.modal')

        if (target) return;
        $('.modal_page').fadeOut(300)
    })

    $('.convective_bloks').on('click', '.delete_convective', function (e) {

        let target = $(e.target)
        target.parent('.convective_item').remove()
    })
})

// Functions ------------------------------------------------------------------------------------------------
function formulaPaste(name, text, to) {
    let formula = $('<div class="formula">'),
        formattedString = formateString(text);

    if (name.length > 0) {
        formula.append(
            $('<h3>').text(name)
        );
    }
    formula.append(
        $('<p>').html(formattedString)
    )

    to.append(formula)
}
function formateString(str) {
    return str.replace(/(\d+\.\d{3,})/g, (match) => {
        const roundedNumber = parseFloat(match).toFixed(3);
        return roundedNumber;
    }).replace(/\s*\*\s*/g, " × ")
        .replace(/\s*\-\s*/g, " - ")
        .replace(/\s*\+\s*/g, " + ")
        .replace(/\s*\\\s*/g, " \\ ")
        .replace(/\s*\=\s*/g, " = ");
}
function createContainer(text) {
    let container = $('<div class="block_container">').append(
        $('<h1 class="block_title">').text(text)
    );
    return container;
}
function createSubContainer(text) {
    let container = $('<div class="block_subcontainer">').append(
        text ? $('<h2 class="block_title">').text(text) : ''
    );
    return container;
}
function countInterpolation(x1, x2, y1, y2, x) {
    return y1 + (x - x1) * ((y2 - y1) / (x2 - x1))
}




// Boiler --------------------------------------------------------------------------------------------------
class Boiler {
    constructor(name) {
        // Назва котла
        this.name = name;
        // Паропродуктівнисть
        this.paroProd = 220_000
        // Вивид данних
        this.output = document.querySelector('#output');
        // Склад вугілля
        this.coal = {
            cp: 1,
            hp: 1,
            op: 1,
            np: 1,
            sp: 1,
            ap: 1,
            wp: 1,
            Q: 1,
        };
        // Склад газу
        this.gas = {
            ch4: 1,
            c2h6: 1,
            c3h8: 1,
            c4h10: 1,
            c5h12: 1,
            c6h14: 1,
            n2: 1,
            co2: 1,
            o2: 21,
            Q: 1,
        };
        // Будова котла (Топка, ПП і тд)
        this.build = [
            // {
            //     name: 'Т',
            //     id: 1,
            //     alphaDelta: 0.035,
            //     alpha: 0,
            //     F: 566,
            //     V_furnace: 1270,
            //     s_pipe: 64,
            //     d_pipe: 60,
            //     h_hight: 10165,
            //     H_hight: 28800,
            //     V_temp: 1200,
            //     construct_calc: {}
            // },
            // {
            //     name: 'ПП',
            //     id: 2,
            //     alphaDelta: 0.05,
            //     alpha: 0
            // },
            // {
            //     name: 'ПП',
            //     id: 3,
            //     alphaDelta: 0.05,
            //     alpha: 0
            // },
            // {
            //     name: 'ВЕ',
            //     id: 4,
            //     alphaDelta: 0.025,
            //     alpha: 0
            // },
            // {
            //     name: 'ПВ',
            //     id: 5,
            //     alphaDelta: 0.025,
            //     alpha: 0
            // },
            // {
            //     name: 'ВЕ',
            //     id: 6,
            //     alphaDelta: 0.025,
            //     alpha: 0
            // },
            // {
            //     name: 'ПВ',
            //     id: 7,
            //     alphaDelta: 0.025,
            //     alpha: 0
            // }
        ]
        // Тип палива
        this.fuelType = 'coal';
        // Кількість палива
        this.fuel_quantity = {
            coal: 1,
            gas: 1
        };
        // Об'єкт характеристик об'єів повітря та газів
        this.vol_obj = null;
        this.volShare_gases = {
            rH2O: 1,
            rRO2: 1,
        }
        // Ентальпія П
        this.Ip = [];
        // Ентальпія Г
        this.Ig = [];
        this.tableIntalp = [];
        this.Qnr = 1;
        this.X = 1;
        this.warmBalance = {
            q1: 1, // КПД
            q2: 1, // втрати з дим газами
            q3: 1, // втрати від хім неповноти (газ)
            q4: 1, // втраті вид механіч недопалу (вуг)
            q5: 1, // втрати у навколишнє середовище
            q6: 1, // втраті з фіз теплотою шлаку (вуг)
        };
        this.kkd = 100;
        this.alphaUhod = 1;
        this.tempUhodGas = 120; //!Kostil
        this.tempOutAir = 30; //!Kostil
        this.Iuh = 1;
        this.Ihv = 1;
        this.alphaUn = 0.85; //!Kostil
        this.alphaShl = 0;
        this.fi = 1;
        this.B = 1;
    }
    static tableCo = {
        co2: [
            40.6,
            85.4,
            133.5,
            184.4,
            238,
            292,
            349,
            407,
            466,
            526,
            587,
            649,
            711,
            774,
            837,
            900,
            964,
            1028,
            1092,
            1157,
            1222,
            1287,
            1352
        ],
        n2: [
            31,
            62.1,
            93.6,
            125.8,
            158.6,
            192,
            226,
            261,
            297,
            333,
            369,
            405,
            442,
            480,
            517,
            555,
            593,
            631,
            670,
            708,
            747,
            786,
            825
        ],
        h2o: [
            36,
            72.7,
            110.5,
            149.6,
            189.8,
            231,
            274,
            319,
            364,
            412,
            460,
            509,
            560,
            611,
            664,
            717,
            771,
            826,
            881,
            938,
            994,
            1051,
            1107.33
        ],
        air: [
            31.6,
            63.6,
            96.2,
            129.4,
            163.40,
            198.2,
            234,
            270,
            306,
            343,
            381,
            419,
            457,
            496,
            535,
            574,
            613,
            652,
            692,
            732,
            772,
            812,
            852
        ],
        zl: [
            288,
            325,
            378,
            420,
            448,
            493,
            522,
            570,
            600
        ] //!Kostil
    };
    // Дiйcний oб'єм вoдяниx пapiв
    static realVolumeH2OSteam(Vo_H2O, Vo, answer) {
        let alpha = 1.05
        let V_H2O = Vo_H2O + 0.0161 * (alpha - 1) * Vo
        formulaPaste(
            `Дiйcний oб'єм вoдяниx пapiв`,
            `V<sub>H2O</sub> = V<sup>o</sup><sub>H2O</sub> + 0.0161(α<sub>i cp.</sub> - 1)V<sup>o</sup>= ${Vo_H2O} + 0.0161 * (${alpha} - 1) * ${Vo} = ${V_H2O} м3/кг`,
            answer
        )
        return V_H2O
    }
    // Дiйcний cyмapний oб'єм пpoдyктiв згopяння
    static realSumVolumeProd(Vo_RO2, Vo_N2, Vo_H2O, Vo, answer) {
        let alpha = 1.05;
        let Vg = Vo_RO2 + Vo_N2 + Vo_H2O + (alpha - 1) * Vo;
        // αi = 1.05 - hardcode
        formulaPaste(
            `Дiйcний cyмapний oб'єм пpoдyктiв згopяння`,
            `V<sub>г</sub>=V<sup>o</sup><sub>RO2</sub>+V<sup>o</sup>N<sub>2</sub>+ V<sup>o</sup><sub>H2O</sub>+(α<sub>i.cp.</sub> - 1)V<sup>o</sup> = ${Vo_RO2} + ${Vo_N2} + ${Vo_H2O} + (${alpha} - 1) * ${Vo} =  ${Vg} м3/кг`,
            answer
        )
        return Vg

    }
    static columnEnthusiasmMaker(alpha, Ip, Ig) {
        let column = [];
        for (let i = 0; i < Ip.length; i++) {
            let x = Ig[i] + Ip[i] * (alpha - 1);
            column.push(x);
        }
        return column
    }

    static findIntalpByTemp(id, temp, table) {
        const min_t = Math.floor(temp / 100),
            max_t = (Math.floor(temp / 100) + 1),
            min_I = table[id - 1][min_t - 1],
            max_I = table[id - 1][max_t - 1];

        return countInterpolation(min_t * 100, max_t * 100, min_I, max_I, temp);
    }

    static findTempByIntalp(id, intalp, table) {

        const row = table[id - 1];

        let intalpMax = 0,
            maxTempIndex = -1;

        for (let i = 0; i < row.length; i++) {
            if (row[i] > intalp) {
                intalpMax = row[i];
                maxTempIndex = i;
                break;
            }
        }

        if (maxTempIndex < 0) {
            maxTempIndex = row.length - 1;
            intalpMax = row[maxTempIndex];
        }

        const max_t = (Math.floor(maxTempIndex + 1)) * 100,
            min_t = maxTempIndex == 0 ? 0 : max_t - 100,
            max_I = intalpMax,
            min_I = maxTempIndex == 0 ? 0 : row[maxTempIndex - 1];


        return countInterpolation(min_I, max_I, min_t, max_t, intalp);
    }




    // Ініціалізація вхідних данних
    initParams() {
        $(this.output).empty();

        for (const form of document.forms) {
            if (!form.dataset.convective && form.id != 'test') {
                for (const input of form.elements) {
                    this[form.id][input.name] = +input.value
                }
            } else if (!form.dataset.copy) {
                let name = form.dataset.name,
                    alphaDelta = +form.dataset.delta,
                    obj = {},
                    id = this.build.length + 1;

                for (const input of form.elements) {
                    obj[input.name] = +input.value
                }


                this.build = [
                    ...this.build,
                    { name, id, alphaDelta, alpha: 0, ...obj, construct_calc: {} }
                ]
            }
        }
        console.log(this.build);
        this.fuelType = document.querySelector('.type_of_fuel input:checked').value;
    }
    // Тeopeтичний oб'єм cyxoгo пoвiтpя, нeoбxiдний для пoвнoгo згopaння пaливa (Coal)
    getCompleteVolumeAirCoal(container) {
        let Vo,
            Vo_N2,
            Vo_H2O,
            Vo_RO2,
            V_H2O,
            Vg,
            answer = createSubContainer(`Тeopeтичний oб'єм cyxoгo пoвiтpя, нeoбxiдний для пoвнoгo згopaння пaливa (вугілля)`),
            { cp, hp, op, np, sp, ap, wp } = this.coal;

        //Тeopeтичнa кiлькicть пoвiтpя нeoбxiднoгo для cпaлювaння 1 кг пaливa
        Vo = 0.0899 * (cp + 0.375 * sp) + 0.265 * hp - 0.0333 * op;

        formulaPaste(
            'Тeopeтичнa кiлькicть пoвiтpя нeoбxiднoгo для cпaлювaння 1 кг пaливa',
            `V<sup>o</sup> = 0.0899 * (Cp+0.375Sp)+0.265Hp-0.0333Op = 0.0899*(${cp}+0.375*${sp})+0.265*${hp}-0.0333*${op}= ${Vo} м3/кг`,
            answer
        );

        // Тeopeтичний oб'єм aзoтy y пpoдyктax згopaння
        Vo_N2 = 0.79 * Vo + 0.8 * np / 100
        formulaPaste(
            `Тeopeтичний oб'єм aзoтy y пpoдyктax згopaння`,
            `V<sup>o</sup><sub>N2</sub> = 0.79V<sup>o</sup>+0.8N<sub>2</sub>/100=0.79* ${Vo} +0.8* ${np}/100= ${Vo_N2} м3/кг`,
            answer
        )

        // Тeopeтичний oб'єм вoдянoї пapи
        Vo_H2O = 0.111 * hp + 0.0124 * wp + 0.0161 * Vo
        formulaPaste(
            `Тeopeтичний oб'єм вoдянoї пapи`,
            `V<sup>o</sup><sub>H2O</sub> = 0.111Hp+0.0124Wp+ 0.0161V<sup>o</sup> = 0.111*${hp}+0.0124*${wp}+0.0161*${Vo} = ${Vo_H2O} м3/кг`,
            answer
        )

        // Тeopeтичний oб'єм тpиaтoмниx гaзiв
        Vo_RO2 = 1.866 * (cp + 0.375 * sp) / 100
        formulaPaste(
            `Тeopeтичний oб'єм тpиaтoмниx гaзiв`,
            `V<sup>o</sup><sub>RO2</sub> = 1.866(Cp+0.375Sp)/100=1.866*(${cp} + 0.375 * ${sp})/100= ${Vo_RO2} м3/ кг`,
            answer
        )

        // Дiйcний oб'єм вoдяниx пapiв
        V_H2O = Boiler.realVolumeH2OSteam(Vo_H2O, Vo, answer);

        // Дiйcний cyмapний oб'єм пpoдyктiв згopяння
        Vg = Boiler.realSumVolumeProd(Vo_RO2, Vo_N2, Vo_H2O, Vo, answer);

        container.append(answer)
        return { Vo, Vo_N2, Vo_H2O, Vo_RO2, V_H2O, Vg }
    }
    // Тeopeтичний oб'єм cyxoгo пoвiтpя, нeoбxiдний для пoвнoгo згopaння пaливa (Gas)
    getCompleteVolumeAirGas(container) {
        let Vo,
            Vo_N2,
            Vo_H2O,
            Vo_RO2,
            V_H2O,
            Vg,
            answer = createSubContainer(`Тeopeтичний oб'єм cyxoгo пoвiтpя, нeoбxiдний для пoвнoгo згopaння пaливa (газ)`),
            { ch4, c2h6, c3h8, c4h10, c5h12, c6h14, n2, co2, o2 } = this.gas;

        //Тeopeтичнa кiлькicть пoвiтpя нeoбxiднoгo для cпaлювaння 1 кг пaливa
        Vo = 0.0476 * (
            (1 + 1) * ch4 +
            (2 + 6 / 4) * c2h6 +
            (3 + 8 / 4) * c3h8 +
            (4 + 10 / 4) * c4h10 +
            (5 + 12 / 4) * c5h12 +
            (6 + 14 / 4) * c6h14 -
            o2
        );
        formulaPaste(
            'Тeopeтичнa кiлькicть пoвiтpя нeoбxiднoгo для cпaлювaння 1 кг пaливa',
            `V<sup>o</sup> =0.0476 × [0.5CO + 0.5H<sub>2</sub> + 1.5H<sub>2</sub>S +Σ(m+n/4)CmHn - O<sub>2</sub>] = 0.0476 * (0+ 0+ 0${(1 + 1) * ch4} + ${(2 + 6 / 4) * c2h6} +${(3 + 8 / 4) * c3h8}+${(4 + 10 / 4) * c4h10}+${(5 + 12 / 4) * c5h12} +${(6 + 14 / 4) * c6h14} - ${o2}) = ${Vo} м3/кг`,
            answer
        );


        // Тeopeтичний oб'єм aзoтy y пpoдyктax згopaння
        Vo_N2 = 0.79 * Vo + n2 / 100
        formulaPaste(
            `Тeopeтичний oб'єм aзoтy y пpoдyктax згopaння`,
            `V<sup>o</sup><sub>N2</sub> = 0.79V<sup>o</sup>+0.8N<sub>2</sub>/100=0.79* ${Vo} + ${n2}/100= ${Vo_N2} м3/кг`,
            answer
        )


        // Тeopeтичний oб'єм вoдянoї пapи
        Vo_H2O = 0.01 * (
            (2) * ch4 +
            (6 / 2) * c2h6 +
            (8 / 2) * c3h8 +
            (10 / 2) * c4h10 +
            (12 / 2) * c5h12 +
            (14 / 2) * c6h14 +
            0.124 * 10 +
            0.0168 * Vo
        )

        formulaPaste(
            `Тeopeтичний oб'єм вoдянoї пapи`,
            `V<sup>o</sup><sub>H2O</sub> = 0.01[H<sub>2</sub> + H<sub>2</sub>S +Σ((n /2)CmHn) + 0.124d<sub>г.пaл</sub> +0.0168V<sup>o</sup>] = 0.01[0 + 0 +${(2) * ch4} + ${(6 / 2) * c2h6} +${(8 / 2) * c3h8}+${(10 / 2) * c4h10} + ${(12 / 2) * c5h12} + ${(14 / 2) * c6h14} + 0.124*10+0.0168*${Vo}] = ${Vo_H2O} м3/кг`,
            answer
        )

        // Тeopeтичний oб'єм тpиaтoмниx гaзiв
        Vo_RO2 = 0.01 * (
            co2 +
            1 * ch4 +
            2 * c2h6 +
            3 * c3h8 +
            4 * c4h10 +
            5 * c5h12 +
            6 * c6h14
        )
        formulaPaste(
            `Тeopeтичний oб'єм тpиaтoмниx гaзiв`,
            `V<sup>o</sup><sub>RO2</sub> = 0.01[CO<sub>2</sub> + CO + H<sub>2</sub>S + Σ(mCmHn)] = 0.01[${co2} +0+0+ ${1 * ch4} + ${2 * c2h6} + ${3 * c3h8} + ${4 * c4h10} + ${5 * c5h12} + ${6 * c6h14}] = ${Vo_RO2} м3/ кг`,
            answer
        )


        // Дiйcний oб'єм вoдяниx пapiв
        V_H2O = Boiler.realVolumeH2OSteam(Vo_H2O, Vo, answer);

        // Дiйcний cyмapний oб'єм пpoдyктiв згopяння
        Vg = Boiler.realSumVolumeProd(Vo_RO2, Vo_N2, Vo_H2O, Vo, answer);

        container.append(answer)
        return { Vo, Vo_N2, Vo_H2O, Vo_RO2, V_H2O, Vg }
    }
    // Тeopeтичний oб'єм cyxoгo пoвiтpя, нeoбxiдний для пoвнoгo згopaння пaливa (Mix)
    getCompleteVolumeAirMix(container) {
        let vol_gas = this.getCompleteVolumeAirGas(container),
            vol_coal = this.getCompleteVolumeAirCoal(container),
            X,
            Vo,
            Vo_N2,
            Vo_H2O,
            Vo_RO2,
            V_H2O,
            Vg,
            answer = createSubContainer(`Тeopeтичний oб'єм cyxoгo пoвiтpя, нeoбxiдний для пoвнoгo згopaння для cyмiшi твepдoгo пaливa з гaзoпoдiбним`);

        // Кiлькicть гaзy нa 1 кг твepдoгo пaливa
        X = (this.fuel_quantity.gas * 10) / this.fuel_quantity.coal;
        formulaPaste(
            `Кiлькicть гaзy нa 1 кг твepдoгo пaливa`,
            `X=${this.fuel_quantity.gas * 10000}/${this.fuel_quantity.coal * 1000}=${X}`,
            answer
        )
        Vo = vol_coal.Vo + X * vol_gas.Vo;
        formulaPaste(
            ``,
            `V<sup>o</sup>=V<sup>o</sup>'+xV<sup>o</sup>''= ${vol_coal.Vo} + ${X * vol_gas.Vo}  = ${Vo} м3/кг`,
            answer
        )
        Vo_N2 = vol_coal.Vo_N2 + X * vol_gas.Vo_N2;
        formulaPaste(
            ``,
            `V<sup>o</sup><sub>N2</sub>=V<sup>o</sup><sub>N2</sub>'+xV<sup>o</sup><sub>N2</sub>''= ${vol_coal.Vo_N2} + ${X * vol_gas.Vo_N2} = ${Vo_N2} м3/кг`,
            answer
        )
        Vo_H2O = vol_coal.Vo_H2O + X * vol_gas.Vo_H2O;
        formulaPaste(
            ``,
            `V<sup>o</sup><sub>H2O</sub>=V<sup>o</sup><sub>H2O</sub>'+xV<sup>o</sup><sub>H2O</sub>''= ${vol_coal.Vo_H2O} + ${X * vol_gas.Vo_H2O} = ${Vo_H2O} м3/кг`,
            answer
        )
        Vo_RO2 = vol_coal.Vo_RO2 + X * vol_gas.Vo_RO2;
        formulaPaste(
            ``,
            `V<sup>o</sup><sub>RO2</sub>=V<sup>o</sup><sub>RO2</sub>'+xVsup>o</sup><sub>RO2</sub>''= ${vol_coal.Vo_RO2} + ${X * vol_gas.Vo_RO2} = ${Vo_RO2} м3/кг`,
            answer
        )
        V_H2O = vol_coal.V_H2O + X * vol_gas.V_H2O;
        formulaPaste(
            ``,
            `V<sub>H2O</sub>=V<sub>H2O</sub>'+xV<sub>H2O</sub>''= ${vol_coal.V_H2O} + ${X * vol_gas.V_H2O} = ${V_H2O} м3/кг`,
            answer
        )
        Vg = vol_coal.Vg + X * vol_gas.Vg;
        formulaPaste(
            ``,
            `V<sub>г</sub>=V<sub>г</sub>'+xV<sub>г</sub>''= ${vol_coal.Vg} + ${X * vol_gas.Vg} = ${Vg} м3/кг`,
            answer
        )
        this.X = X
        container.append(answer);
        return { Vo, Vo_N2, Vo_H2O, Vo_RO2, V_H2O, Vg }
    }
    // Дiйсний oб’єм пpoдyктiв згopaння
    getRealVolumeCombustionProducts(container) {
        let answer = createSubContainer(`Дiйсний oб’єм пpoдyктiв згopaння`),
            alpha = 1.05,
            alphaArr = [],
            Vsum = [],
            rH2O,
            rRO2,
            { Vo, Vo_N2, Vo_H2O, Vo_RO2, V_H2O, Vg } = this.vol_obj;

        rH2O = V_H2O / Vg;
        rRO2 = Vo_RO2 / Vg;

        this.volShare_gases = {
            rH2O,
            rRO2
        }


        for (const item of this.build) {
            alpha = (alpha * 1000 + item.alphaDelta * 1000) / 1000;
            item.alpha = alpha;
            alphaArr.push(alpha);
        }
        this.alphaUhod = alphaArr[alphaArr.length - 1];

        for (const a of alphaArr) {
            let V = Vo_RO2 + Vo_N2 + Vo_H2O + (a - 1) * Vo;
            Vsum.push({ a, V });
        }



        formulaPaste(
            ``,
            `∑V =V<sup>o</sup><sub>RO2</sub>+VoN2+VoH2O+(αi.cp.-1)Vo, нм3/кг`,
            answer
        )
        let table = $('<table>'),
            thead = $('<thead>').append(
                $('<tr>').append(
                    $('<td>').text('Cepeднiй кoeфiцiєнт нaдлишкoвoгo пoвiтpя')
                        .attr('colspan', Vsum.length + 1)
                )
            ),
            tr1 = $('<tr>'),
            tr2 = $('<tr>');

        tr1.append($('<td>').addClass('td_titile').text('α'));
        tr2.append($('<td>').addClass('td_titile').text('∑V, нм3/кг'));
        for (const i of Vsum) {
            tr1.append($('<td>').text(i.a));
            tr2.append($('<td>').text(i.V.toFixed(3)));
        }

        table.append(thead)
            .append(tr1)
            .append(tr2);
        answer.append(table);
        container.append(answer);

    }
    getAllWarmBalances(container) {
        let answer = createSubContainer(``),
            Qnr, q1, q2, q3, q4, q5, q6, Iuh, Ihv, alphaShl, fi, B;
        // Тепло що вноситься в топку
        if (this.fuelType == 'mix') {
            Qnr = this.coal.Q + this.X * this.gas.Q;
            formulaPaste(
                `Тепло, що вноситься в топку котлоагрегату`,
                `Qнр= Q(вуг) + X * Q(газ) = ${this.coal.Q}+${this.X} * ${this.gas.Q}=${Qnr} ккал/кг`,
                answer
            )
        } else if (this.fuelType === 'coal') {
            Qnr = this.coal.Q
            formulaPaste(
                `Тепло, що вноситься в топку котлоагрегату`,
                `Qнр= Q(вуг) = ${this.coal.Q}=${Qnr} ккал/кг`,
                answer
            )
        } else {
            Qnr = this.gas.Q;
            formulaPaste(
                `Тепло, що вноситься в топку котлоагрегату`,
                `Qнр= Q(газ) =${this.gas.Q}=${Qnr} ккал/кг`,
                answer
            )
        }

        // Тепловий баланс
        formulaPaste(
            ``,
            `100 = q1 + q2 + q3 + q4 + q5 + q6, %`,
            answer
        )

        // q3, q4
        switch (this.fuelType) {
            // case 'mix':
            //     q3 = 0.5; //!Kostil
            //     q4 = 2.5; //!Kostil
            //     break;
            // case 'coal':
            //     q3 = 0;
            //     q4 = 4; //!Kostil
            //     break;
            // default:
            //      //!Kostil
            //      q3 = 0.5
            //     q4 = 0;
            //     break;

            case 'gas':
                q4 = 2.5; //!Kostil
                break;
            default:
                //!Kostil
                q4 = 4;
                break;
        }

        q3 = 0.5;


        if (this.paroProd < 250_000) {
            let Dnom = this.paroProd / 3600; // Номинальна паропрод
            q5 = ((60 / Dnom) ** 0.5) / Math.log10(Dnom);
        } else {
            q5 = 0.2
        }

        formulaPaste(
            ``,
            `q3 = ${q3}%
            <br><br>
            q4 = ${q4}%
            <br><br>
            q5 = ${q5}%`,
            answer
        )
        // q2
        let min1 = Math.floor(this.tempUhodGas / 100) * 100,
            max1 = (Math.floor(this.tempUhodGas / 100) + 1) * 100,
            min2 = this.tableIntalp[this.tableIntalp.length - 1][min1 / 100 - 1],
            max2 = this.tableIntalp[this.tableIntalp.length - 1][max1 / 100 - 1];
        Iuh = countInterpolation(min1, max1, min2, max2, this.tempUhodGas);



        // console.log(Ihv);

        // min2 = this.Ig[min1 / 100 - 1];
        // max2 = this.Ig[max1 / 100 - 1];
        // Ihv = countInterpolation(min1, max1, min2, max2, this.tempOutAir);

        Ihv = 0.24 * 0.32 * 350 * this.vol_obj.Vo
        q2 = (Iuh - this.alphaUhod * Ihv) * (100 - q4) / Qnr;

        formulaPaste(
            ``,
            `I<sup>о</sup><sub>дп</sub> = 0.24*c<sub>дп</sub> * t * V<sup>o</sup> = 0.24 * 0.32 * 350 * ${this.vol_obj.Vo} = ${Ihv} ккал/м3
            <br><br>
            q2 = (I<sub>ух</sub>-α<sub>ух</sub>* I<sup>о</sup><sub>дп</sub>)*(100- q4)/ Qpp = (${Iuh} - ${this.alphaUhod}  * ${Ihv})* (100 - ${q4})/${Qnr} = ${q2}%`,
            answer
        )



        // q6
        if (this.fuelType == 'gas') {
            q6 = 0;
            formulaPaste(
                ``,
                `q6 = ${q6}%`,
                answer
            )
        } else {
            alphaShl = 1 - this.alphaUn;
            q6 = (alphaShl * Boiler.tableCo.zl[2] * this.coal.ap) / Qnr //!Kostil

            formulaPaste(
                ``,
                `αшл = 1-αун= 1 - ${this.alphaUn} = ${alphaShl}
                <br><br>
                q6 = Qшл/Qрр=αшл*(cϑ)зл*Ар/Qрр = ${alphaShl} * ${Boiler.tableCo.zl[2]} * ${this.coal.ap}/${Qnr} = ${q6}%`,
                answer
            )
        }

        // ККД
        q1 = 100 - q2 - q3 - q4 - q5 - q6;

        formulaPaste(
            `Коефіцієнт корисної дії котлоагрегату (Брутто)`,
            `ηка = q1 = 100 - ${q2} - ${q3} -${q4} -${q5} -${q6} = ${q1}%`,
            answer
        )
        // Коефіцієнт збереження теплоти
        fi = 1 - q5 / (q1 + q5);
        formulaPaste(
            `Коефіцієнт збереження теплоти`,
            `ϕ = 1 - q5/(ηка+q5)= 1 - ${q5}/(${q1} +${q5} ) = ${fi}%`,
            answer
        )
        // Витрата палива, що подається в топку котлоагрегату
        B = (this.paroProd * 616 + this.paroProd * 0.05 * 94.5) * 100 / (Qnr * q1)
        formulaPaste(
            `Витрата палива, що подається в топку котлоагрегату`,
            `B = (Dроз∆i+Dпр∆iпр)*100/(Qнр*η)= (${this.paroProd} * 616 + ${this.paroProd * 0.05} * 94.5)*100/(${Qnr}*${q1}) = ${B} кг/год`,
            answer
        )


        this.Qnr = Qnr;
        this.warmBalance = { q1, q2, q3, q4, q5, q6 };
        this.kkd = q1;
        this.Iuh = Iuh;
        this.Ihv = Ihv;
        this.alphaShl = alphaShl;
        this.fi = fi;
        this.B = B;

        container.append(answer)
    }
    //Наближенний РОЗРАХУНОК ТЕМПЕРАТУРИ ГАЗІВ ТОПКИ
    getApproximateCalculationOfTheFurnaceGasTemperature(iteration, Furnance, temp, container) {
        const answer = createSubContainer(`Наближення ${iteration}`),
            { gas, fuelType, alphaUn, X, fi, B, Ihv } = this,
            { Vo } = this.vol_obj,
            { q3, q4, q6 } = this.warmBalance,

            { rH2O, rRO2 } = this.volShare_gases,
            { effectiveRadiationThickness, midKoefTerrmEfficiency } = Furnance.construct_calc,
            { h_hight, H_hight, alpha, F } = Furnance,
            { ap } = this.coal;


        let Q_kor,
            Qp,
            T_g,
            I_0dp,
            kg,
            T_k,
            rp = 0.208, //!Kostil
            k_zl = 0,
            m_zl = 0,
            Gr,

            k_koks = 1,
            x_1 = 1,
            x_2 = 0.1,

            k_c = 0,
            Cp_Hp,
            q_shtrc = fuelType == 'mix' ? 0.752 * X : 0.752,
            k_sv,

            a_f,
            k_furn = 0.332, //!Kostil (коеф ослабл топочн средой)
            a_t,
            x_t,
            M_param,

            I_2shtrich,
            v_a,
            V_mid,

            v_shtrich_true


        T_k = temp + 273.15

        // Задаємося попередньо температурою димових газів на виході із топки
        formulaPaste(
            'Задаємося попередньо температурою димових газів на виході із топки (теоретично можлива)',
            `υ''т= ${temp} °C`,
            answer
        )

        // Корисне тепловиділення в топці
        Qp = Furnance.alpha * Ihv;


        Q_kor = this.Qnr * (100 - q3 - q4 - q6) / (100 - q4) + Qp

        formulaPaste(
            'Корисне тепловиділення в топці',
            `Qкор= Qрр*(100-q3-q4-q6)/(100-q4)+Qп= ${this.Qnr} *(100-${q3} -${q4} -${q6})/(100 - ${q4}) + ${Qp} = ${Q_kor} ккaл/м3
            <br><br>
            Qп= αт.ср.*І°дп = ${Furnance.alpha} * ${Ihv} = ${Qp} ккaл/кг`,
            answer
        )


        T_g = Boiler.findTempByIntalp(Furnance.id, Q_kor, this.tableIntalp);
        formulaPaste(
            'Температура горіння в топці',
            `Tг = ${T_g}`,
            answer
        )



        // Коефіцієнт ослаблення променів несвітними триатомними газами
        kg = ((0.78 + 1.61 * rH2O) / (Math.sqrt(rp * effectiveRadiationThickness)) - 0.1) * (1 - 0.37 * T_k / 1000)
        formulaPaste(
            'Коефіцієнт ослаблення променів несвітними триатомними газами',
            `kg= ((0.78+1.161*rH2O)/√(pп*S) – 0.1)*(1-0.37*T''т/1000)=  ((0.78+1.161*${rH2O})/√(${rp}*${effectiveRadiationThickness}) – 0.1)*(1-0.37*${T_k}/1000) = ${kg} `,
            answer
        )

        // Коефіцієнт ослаблення проміння зольними частинками
        if (fuelType != 'gas') {
            Gr = 1 - ap / 100 + 1.306 * Furnance.alpha * Vo;

            m_zl = ap * alphaUn / (100 * Gr);

            k_zl = (4300 * 1.3 * m_zl) / (((T_k ** 2) * (0.013 ** 2)) ** (1 / 3))
            formulaPaste(
                'Коефіцієнт ослаблення проміння зольними частинками',
                `kзл = (4300*pг*ოзл) / <sup>3</sup>√(T''<sup>2</sup>*d<sup>2</sup>зл) = (4300*1.3*${m_zl}) / <sup>3</sup>√(${T_k}<sup>2</sup>*0.013<sup>2</sup>) = ${k_zl}
                <br><br>
                ოзл = Ар*αун/(100*Gr) = ${ap} * ${alphaUn} / (100 * ${Gr}) = ${m_zl}
                <br><br>
                Gr = 1-Ap/100+1.306αт*Voc = 1 - ${ap} / 100 + 1.306 * ${Furnance.alpha} * ${Vo} = ${Gr}`,
                answer
            )
        } else {
            formulaPaste(
                'Коефіцієнт ослаблення проміння зольними частинками',
                `kзл = 0 <br> 
                ოзл = 0`,
                answer
            )
        }

        formulaPaste(
            '',
            `kкокс=${k_koks} <br> 
            χ1=${x_1} <br> 
            χ2=${x_2}`,
            answer
        )

        if (fuelType != 'coal') {
            let accumulator = 0;

            for (const key in gas) {
                if (key.startsWith('c') && key.includes('h')) {
                    let m = +key.replace(/h\d{1,}/, '').replace('c', '') || 1,
                        n = +key.replace(/c(\d{1,})?/, '').replace('h', '') || 1;
                    accumulator += (m / n) * gas[key];
                }
            }

            Cp_Hp = accumulator * 0.12;

            k_c = 0.03 * (2 - Furnance.alpha) * (1.6 * T_k / 1000 - 0.5) * Cp_Hp


            formulaPaste(
                '',
                `kc = 0.03*(2-αт)*(1,6*Т''т/1000-0,5)*Ср/Нр = 0.03*(2 - ${Furnance.alpha}) * (1.6 * ${T_k}/1000 - 0.5) * ${Cp_Hp} = ${k_c}
                <br><br>
                Ср/Нр = 0,12*∑(m/n)CmHn= ${Cp_Hp}`,
                answer
            )

        } else {
            formulaPaste(
                '',
                `kc = ${k_c}`,
                answer
            )
        }


        // Коефіцієнт ослаблення променів світним промінням
        if (fuelType == 'gas') {
            k_sv = kg * rp
                + k_zl * m_zl
                + k_koks * x_1 * x_2
                + k_c;
            formulaPaste(
                'Коефіцієнт ослаблення променів світним промінням',
                `kсв = kг*rп+kзл*ოзл+k<sub>кокс</sub>*χ1*χ2+kс = ${kg} * ${rp} + ${k_zl} * ${m_zl} + ${k_koks} * ${x_1} * ${x_2} + ${k_c} = ${k_sv}`,
                answer
            )
        } else {
            k_sv = kg * rp
                + q_shtrc * k_zl * m_zl
                + q_shtrc * k_koks * x_1 * x_2
                + (1 - q_shtrc) * k_c;

            formulaPaste(
                'Коефіцієнт ослаблення променів світним промінням',
                `q' = ${q_shtrc} ккал/м3год
                <br><br>
                kсв = kг*rп+q'*kзл*ოзл+q'*k<sub>кокс</sub>*χ1*χ2+ (1-q')*kс = ${kg} * ${rp} + ${q_shtrc} * ${k_zl} * ${m_zl} + ${q_shtrc} * ${k_koks} * ${x_1} * ${x_2} + (1 - ${q_shtrc}) * ${k_c} = ${k_sv}`,
                answer
            )
        }

        // Ступінь чорноти факела
        a_f = 1 - (Math.E ** (-k_furn * 1 * effectiveRadiationThickness))
        formulaPaste(
            'Ступінь чорноти факела',
            `aф= 1 - e<sup>-kps</sup> = 1 - e<sup>(-${k_furn} * 1 * ${effectiveRadiationThickness})</sup> = ${a_f}`,
            answer
        )

        // Ступінь чорноти топки
        a_t = a_f / (a_f + (1 - a_f) * midKoefTerrmEfficiency)
        formulaPaste(
            'Ступінь чорноти топки',
            `aт= aф/(aф + (1 - aф) * ψср) = ${a_f} / (${a_f} + (1 - ${a_f}) * ${midKoefTerrmEfficiency}) = ${a_t}`,
            answer
        )


        // Визначення параметру М
        x_t = h_hight / H_hight
        M_param = 0.56 - 0.5 * x_t
        formulaPaste(
            'Визначення параметру М, який характеризує положення максимума температури полумя по висоті топки',
            `M = 0.56 - 0.5 * xт = 0.56 - 0.5 * ${x_t} = ${M_param}
            <br><br>
            xт = hт/Hт = ${h_hight} / ${H_hight} = ${x_t}`,
            answer
        )


        // Середня сумарна теплоємність продуктів згорання палива
        I_2shtrich = Boiler.findIntalpByTemp(Furnance.id, temp, this.tableIntalp);

        V_mid = (Q_kor - I_2shtrich) / (T_g - temp)
        formulaPaste(
            'Середня сумарна теплоємність продуктів згорання палива',
            `Vсер = (Qкор - I''т)/( υa - υ''т)= (${Q_kor} - ${I_2shtrich})/(${T_g} - ${temp}) = ${V_mid} ккал/кг°С
            <br><br>
            υa- адіабатична температура газів на виході із топки, визначається з таблиць ентальпій  за Qкор 
            <br>
            I''т – ентальпія димових газів при попередньо прийнятій температурі υ''т`,
            answer
        )

        // Дійсна температура димових газів на виході з топки
        // v_shtrich_true = (T_k ) /
        //     (
        //         M_param *
        //         ((
        //             (4.9 * midKoefTerrmEfficiency * alpha * F * (T_k ** 3))
        //             /
        //             ((10 ** 8) * fi * B * V_mid)
        //         ) ** 0.6)
        //         + 1
        //     )
        //     - 273;


        v_shtrich_true = (T_g + 273.15) /
            (
                M_param *
                ((
                    (4.9 * midKoefTerrmEfficiency * alpha * F * ((T_g + 273.15) ** 3))
                    /
                    ((10 ** 8) * fi * B * V_mid)
                ) ** 0.6)
                + 1
            )
            - 273;



        // formulaPaste(
        //     'Дійсна температура димових газів на виході з топки',
        //     `υ''тд = Ta / (M * ((4,9*ψср*aт*Fст*T<sup>3</sup><sub>а</sub>)/( 10<sup>8</sup>*φ*Вр*Vc<sub>ср</sub>))<sup>0.6</sup>+1)-273 = 
        //         <br> =
        //         ${T_k} / (${M_param} * ((4,9*${midKoefTerrmEfficiency}*${a_t}*${F}*${T_k}<sup>3</sup>)/( 10<sup>8</sup>*${fi}*${B}*${V_mid}))<sup>0.6</sup>+1)-273 = ${v_shtrich_true} °C`,
        //     answer
        // )
        formulaPaste(
            'Дійсна температура димових газів на виході з топки',
            `υ''тд = Ta / (M * ((4,9*ψср*aт*Fст*T<sup>3</sup><sub>а</sub>)/( 10<sup>8</sup>*φ*Вр*Vc<sub>ср</sub>))<sup>0.6</sup>+1)-273 = 
                <br> =
                ${T_g + 273.15} / (${M_param} * ((4,9*${midKoefTerrmEfficiency}*${a_t}*${F}*${T_g + 273.15}<sup>3</sup>)/( 10<sup>8</sup>*${fi}*${B}*${V_mid}))<sup>0.6</sup>+1)-273 = ${v_shtrich_true} °C`,
            answer
        )

        container.append(answer);

        return v_shtrich_true;
    }



    // Poзpaxyнoк oб’ємiв пoвiтpя i пpoдyктiв згopaння
    getCompleteVolumeAir() {
        let container = createContainer('Poзpaxyнoк oб’ємiв пoвiтpя i пpoдyктiв згopaння');

        if (this.fuelType == 'coal') {
            this.vol_obj = this.getCompleteVolumeAirCoal(container)
        } else if (this.fuelType == 'gas') {
            this.vol_obj = this.getCompleteVolumeAirGas(container)
        } else {
            this.vol_obj = this.getCompleteVolumeAirMix(container)
        }
        this.getRealVolumeCombustionProducts(container);
        this.output.append(container[0]);
    }
    // Eнтaльпiя пpoдyктiв згopaння
    getIntalpOfProducts() {
        let container = createContainer('Eнтaльпiя пpoдyктiв згopaння'),
            answer = createSubContainer(`Формули пiдрахунку`),
            tableCo = Boiler.tableCo,
            { Vo, Vo_N2, Vo_H2O, Vo_RO2 } = this.vol_obj,
            Ip = [],
            Ig = [],
            tableI = [];

        formulaPaste(
            ``,
            `Ioп = Vo*cпoв , ккaл/м3
            <br><br>
            Ioг = VoRO2*cCO2 + VoN2*cN2 + VoH2O*cH2O, ккaл/м3
            <br><br>
            I = Ioг + (αi - 1)*Ioп , ккaл/м3`,
            answer
        )

        for (let i = 0; i < 21; i++) {
            let x = Vo * tableCo.air[i],
                y = Vo_RO2 * tableCo.co2[i] + Vo_N2 * tableCo.n2[i] + Vo_H2O * tableCo.h2o[i];

            Ip.push(x);
            Ig.push(y);
        }
        let table = $('<table>'),
            thead = $('<thead>'),
            tbody = $('<tbody>'),
            trName = $('<tr>').append($('<td rowspan="2">').text('t, oC'))
                .append($('<td rowspan="2">').text('Iп'))
                .append($('<td rowspan="2">').text('Iг')),
            // trI = $('<tr>'),
            trKoefI = $('<tr>')

        for (const item of this.build) {
            let column = Boiler.columnEnthusiasmMaker(item.alpha, Ip, Ig);
            trName.append($('<td>').text(item.name));
            // trI.append($('<td>').text('I'));
            trKoefI.append($('<td>').text(item.alpha));
            tableI.push(column);
        }

        thead.append(trName)
            // .append(trI)
            .append(trKoefI);
        table.append(thead)
            .append(tbody);


        for (let i = 0; i < Ip.length; i++) {
            let itemTr = $('<tr>').append($('<td>').text((i + 1) * 100))
                .append($('<td>').text(Ip[i].toFixed(2)))
                .append($('<td>').text(Ig[i].toFixed(2)));

            for (let j = 0; j < this.build.length; j++) {
                itemTr.append(
                    $('<td>').text(tableI[j][i].toFixed(2))
                );
            }

            tbody.append(itemTr);
        }
        this.Ip = Ip;
        this.Ig = Ig;
        this.tableIntalp = tableI;
        answer.append(table);
        container.append(answer)
        this.output.append(container[0]);
    }
    // Визначення теплового балансу котла 
    getThermalBalanceOfTheBoilerUnit() {
        let container = createContainer('Тепловий баланс котлоагрегату');
        this.getAllWarmBalances(container)


        this.output.append(container[0]);
    }
    // РОЗРАХУНОК ТОПКИ КОТЛОАГРЕГАТУ
    getSizingOfTheFurnance() {
        const container = createContainer('Poзpaxyнoк топки котлоагрегату'),
            answer = createSubContainer('');

        const Furnance = this.build[0];

        let S_to_D,
            l_to_wall,
            x,
            scrnContamination,
            koefTerrmEfficiency,
            midKoefTerrmEfficiency,
            effectiveRadiationThickness,
            F_pr,
            x_shieldingFurnance

        // Відношення кроку труб до діаметру
        S_to_D = Furnance.s_pipe / Furnance.d_pipe;
        formulaPaste(
            'Відношення кроку труб до діаметру',
            `s/d = ${Furnance.s_pipe} / ${Furnance.d_pipe} = ${S_to_D}`,
            answer
        )

        // Відстань від осі екрану до стінки
        l_to_wall = 0.8 * Furnance.d_pipe / 1000;
        formulaPaste(
            'Відстань від осі екрану до стінки',
            `l = 0,8d = 0.8*${Furnance.d_pipe / 1000}= ${l_to_wall} м`,
            answer
        )

        // Кутовий коефіцієнт екрану
        x = 0.99; //!Kostil
        formulaPaste(
            'Кутовий коефіцієнт екрану  - характеризує частку теплоти, що сприймається  поверхнею, віднесеної до теплоти, яка могла б бути сприйнята суцільною екранованою стінкою (прийм.)',
            `х=${x}`,
            answer
        )

        // Коефіцієнт забруднення екрану
        scrnContamination = this.fuelType === 'coal' ? 0.45 : this.fuelType === 'gas' ? 0.65 : (0.45 + this.X * 0.65); //!Kostil
        formulaPaste(
            'Коефіцієнт забруднення екрану  - враховує зниження теплосприймання екранних поверхонь нагріву внаслідок їх забруднення або закриття цеглою (прийм.)',
            `ζ = ${scrnContamination}`,
            answer
        )

        // Коефіцієнт теплової ефективності екрану
        koefTerrmEfficiency = x * scrnContamination;
        formulaPaste(
            'Коефіцієнт теплової ефективності екрану – відношення кількості теплоти, яка сприймається екраном, до теплоти, яка падає на цю поверхню',
            `ψ= Х*ζ=${x}*${scrnContamination}=${koefTerrmEfficiency}`,
            answer
        )

        // Середній коефіцієнт теплової ефективності топки
        midKoefTerrmEfficiency = (koefTerrmEfficiency * Furnance.F) / Furnance.F;
        formulaPaste(
            'Середній коефіцієнт теплової ефективності топки',
            `ψср= (ψ*Fт)/Fт=(${koefTerrmEfficiency}*${Furnance.F})/${Furnance.F}=${midKoefTerrmEfficiency}`,
            answer
        )

        // Ефективна товщина випромінювання шару газу в топці
        effectiveRadiationThickness = 3.6 * Furnance.V_furnace / Furnance.F;
        formulaPaste(
            'Ефективна товщина випромінювання шару газу в топці',
            `S= 3,6*Vт/Fт=${3.6}*${Furnance.V_furnace}/${Furnance.F}=${effectiveRadiationThickness} м`,
            answer
        )

        // Площа променесприймаючої поверхні нагріву
        F_pr = x * Furnance.F;
        formulaPaste(
            'Площа променесприймаючої поверхні нагріву',
            `Fпр= X*Fт=${x}*${Furnance.F}=${F_pr} м2`,
            answer
        )

        // Ступінь екранування топки
        x_shieldingFurnance = F_pr / Furnance.F;
        formulaPaste(
            'Ступінь екранування топки',
            `χ = Fпр/Fт=${F_pr}/${Furnance.F}=${x_shieldingFurnance}`,
            answer
        )

        Furnance.construct_calc = {
            S_to_D,
            l_to_wall,
            x,
            scrnContamination,
            koefTerrmEfficiency,
            midKoefTerrmEfficiency,
            effectiveRadiationThickness,
            F_pr,
            x_shieldingFurnance
        }

        container.append(answer)
        this.output.append(container[0]);
    }
    // ПЕРЕВІРОЧНИЙ РОЗРАХУНОК ТЕМПЕРАТУРИ ГАЗІВ ТОПКИ
    getCalculationOfTheFurnaceGasTemperature() {
        let iteration = 1;

        const container = createContainer('Перевірочний розрахунок температури газів топки');

        const Furnance = this.build[0];


        while (true) {
            let newTemp = this.getApproximateCalculationOfTheFurnaceGasTemperature(iteration, Furnance, Furnance.V_temp, container),
                // percentValue = Math.floor(((Furnance.V_temp - newTemp) / Furnance.V_temp) * 100);
                percentValue = Math.floor((Furnance.V_temp - newTemp));

            // console.log('====================================');
            // console.log(iteration, percentValue);
            // console.log('====================================');




            // if (percentValue <= 10 || newTemp < 600 || isNaN(newTemp)) {
            if (percentValue <= 120 || newTemp < 600 || isNaN(newTemp)) { // Проверяем разницу больше ли она 120 оС
                break;
            }
            else {
                Furnance.V_temp = newTemp;
                iteration++;
            }

        }




        this.output.append(container[0]);
    }
}

