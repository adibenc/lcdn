let groutes = {
	asset: window.origin + "/storage/",
	imgDefault: "https://dummyimage.com/200x200/555/fff",
};

const throwErr = (err, stat) => {
	if (err.status == 422) {
		let message = err.responseJSON.errors
		let teks_error = ''
		$.each(message, (i, e) => {
			if (e.length > 1) {
				$.each(e, (id, el) => {
					teks_error += `<p>${el}</p>`
				})
			} else {
				teks_error += `<p>${e}</>`
			}
		})
		Swal.fire({
			icon: 'error',
			title: err.responseJSON.message,
			html: teks_error,
		})
	} else {
		let message = err.responseJSON.message
		Swal.fire({
			icon: 'error',
			title: 'Error',
			text: err.responseJSON.message,
		})
	}
};

/**
 * crud class, depend on ajaxer
 *
 * todo: set ajaxer
 *
 */
class CRUD {
	routes = {
		create: "",
		read: "",
		update: "",
		delete: "",
		datatable: "",
	};
	primaryKey = "id"

	form = null;
	formId = null;
	datatable = null;
	ajaxer = null;

	// arr of funcs of then-promises chain of regular crud case
	createThenStatements = []
	updateThenStatements = []
	addThenStatements = []
	editThenStatements = []

	static lastid;

	constructor(form = null) {
		let id = "#form";
		this.form = form ? form : $(id)[0];
		this.formId = id;
	}

	setPrimaryKey(primaryKey) {
		this.primaryKey = primaryKey;
		return this;
	}

	setDatatable(dt) {
		this.datatable = dt;
		return this;
	}

	getDatatable() {
		return this.datatable;
	}

	reloadDatatable() {
		var dt = this.getDatatable();
		if (dt) {
			dt.ajax.reload();
		}
	}

	addCrThenStatements(fn){
		this.createThenStatements.push(fn)

		return this
	}
	
	addUpdateThenStatements(fn){
		this.updateThenStatements.push(fn)

		return this
	}
	
	addAddThenStatements(fn){
		this.addThenStatements.push(fn)

		return this
	}
	
	addEditThenStatements(fn){
		this.editThenStatements.push(fn)

		return this
	}

	setCreateForm() {
		const ctx = this
		$(document).on("click", ".add", function (e) {
			$('.status').hide();
			$("#modal").modal("show");
			form.main.reset();
			$("#form").attr("data-id", "");

			for(let fn of ctx.addThenStatements){
				console.log(fn)
				fn(e)
			}
		});
		
		return this;
	}

	setCreate(id = null) {
		const ctx = this;
		let promise = ajaxer.post(
			this.routes.create,
			new FormData(this.form),
			function (response) { },
			function(err) {
				throwErr(err);
			}
		).then((e)=>{
			if(e.success){
				Swal.fire({
					icon: 'success',
					title: 'Sukses',
					text: e.message,
				})
				// window.location.reload()
				$("#modal").modal("hide");
				ctx.reloadDatatable();
			}else{
				throwErr(e);
			}
		});

		for(let fn of this.createThenStatements){
			promise = promise.then(fn)
		}

		return this;
	}

	setUpdate(id = null) {
		const ctx = this;
		var url = ctx.routes.update.replace("idx", id);
		// cl(url)
		let promise = ajaxer.post(
			ctx.routes.update.replace("idx", id),
			new FormData(this.form),
			function (response) { },
			function(err){
				throwErr(err);
			}
		).then((e)=>{
			if(e.success){
				Swal.fire({
					icon: 'success',
					title: 'Sukses',
					text: e.message,
				})
				// window.location.reload()
				$("#modal").modal("hide");
				ctx.reloadDatatable();
			}else{
				throwErr(e);
			}
		});

		for(let fn of this.updateThenStatements){
			promise = promise.then(fn)
		}

		return this;
	}

	setDelete() {
		const ctx = this;
		$(document).on("click", "#btDelete", function (e) {
			e.preventDefault();
			var id = $(this).attr("data-id");

			Swal.fire({
				icon: 'warning',
				title: 'Yakin?',
				text: 'Anda akan menghapus data ini?',
				showCancelButton:true
			})
			.then(({isConfirmed})=>{
				if(!isConfirmed){
					return
				}
				ajaxer.delete(
					ctx.routes.delete.replace("idx", id),
					null,
					function (response) { },
					function(err){
						throwErr(err);
					}
				).then((e)=>{
					if(e.success){
						Swal.fire({
							icon: 'success',
							title: 'Sukses',
							text: e.message,
						})
						// window.location.reload()
						ctx.reloadDatatable();
					}else{
						throwErr(e);
					}
				});
			})
		});

		return this;
	}

	setupForm(data) {
		let id = data[this.primaryKey]
		$("#form").attr("data-id", id);
		// console.log(response)
		// console.log($('#form').attr("data-id"))
		form.main.set(data);
	}

	getSingle(id) {
		let ctx = this;
		let promise = ajaxer.get(routes.read.replace("idx", id), null, function (response) {
			ctx.setupForm(response.data);
		});

		for(let fn of this.editThenStatements){
			promise = promise.then(fn)
		}
		// get single
	}

	setEdit() {
		let ctx = this;
		// $(document).on("click", "#btEdit", function (e) {
		$(document).on("click", ".btn-edit", function (e) {
			e.preventDefault();
			var id = $(this).attr("data-id");
			console.log(["bt edit", id])
			/** Show Status Field when add */
			$('.status').show();
			CRUD.lastid = id;

			ctx.getSingle(id);
		});

		return this;
	}

	setSubmissionEvent() {
		const ctx = this;
		$(document).on("submit", "#form", function (e) {
			e.preventDefault();
			var data = new FormData(this);
			var id = $("#form").attr("data-id");

			if (id) {
				// alert("update")
				ctx.setUpdate(id);
			} else {
				// alert("create")
				ctx.setCreate(id);
			}
		});

		return this;
	}

	// CRUD.getCommonFn(t)
	static getCommonFn(t){
		switch(t){
			case "toastr":
				return (e)=>{
					if(e.success){
						toastr.success(e.message)
					}else{
						toastr.error(e.message)
					}
				}
		}
	}

	setFullEvent() {
		const ctx = this;

		this.setCreateForm().setSubmissionEvent()
		.setDelete().setEdit();
	}
}

class ItemsView {
    items = [];
    target = "";
    itemFormat = "";
    mappedItems = [];
    mapper = null;
    maxItem = 16;

    constructor() {
        this.mapper = function (e, fmt) {
            return "item";
        };
    }

    getMaxItem() {
        return this.maxItem;
    }

    setMaxItem(maxItem) {
        this.maxItem = maxItem;

        return this;
    }

    resetItems() {
        this.items = [];
        this.mappedItems = [];

        return this;
    }

    getMapper() {
        let mapper = this.mapper;
        if (typeof mapper != "function") {
            throw Error("mapper must be function");
        }

        return mapper;
    }

    setMapper(mapper) {
        if (typeof mapper != "function") {
            throw Error("mapper must be function");
        }

        this.mapper = mapper;

        return this;
    }

    setItems(items) {
        this.items = items;

        return this;
    }

    setItemsAndBuild(items) {
        this.items = items;
        this.build();

        return this;
    }

    /**
     * set joined item to specified selector e
     *
     * */
    async setItemsTo(e, items) {
        this.items = items;
        let builded = this.build();

        await $(e).html("");
        $(e).html(this.getJoinedMappedItems());

        return this;
    }

    getItems() {
        return this.items;
    }

    getJoinedMappedItems() {
        return this.mappedItems.join("");
    }

    build() {
        // this.items
        let ret = "";
        const ctx = this;

        this.items.forEach((e, i) => {
            if (i >= ctx.maxItem) {
                return;
            }

            let el = ctx.getMapper()(e, i);
            // ret += el
            ctx.mappedItems.push(el);
        });

        return ret;
    }
}

/*
sample ProductItemsView

var vprodItem = new ProductItemsView()
let menus = [] // arr of menu
vprodItem.setItemsTo("#box-product", menus || [])

dtMenu.on('search', function (e, setting) {
    let data = dtMenu.rows( { filter : 'applied'} ).data();
    let arrdata = data ? data.toArray() : []
    gl.temp = arrdata
    vprodItem.resetItems().setItemsTo("#box-product", arrdata)
    
    // todos
});

dt.on('draw', function (e, setting, x) {
    let data = dt.rows( { filter : 'applied', page:'current'} ).data();
    let arrdata = data ? data.toArray() : []
    gl.temp = arrdata
    vCartItem.resetItems().setItemsTo("#box-product-cart", arrdata)
});
*/

// gui global ui helper
let ui = {
    br: "<br>",
    /*
    sample
    
    ui.button({
        slot: ""
    })
    */
    button: ({ slot = "", cclass = "", props = "" }) => {
        return `<button type="button" class="btn btn-primary ${cclass}" ${props}>
        ${slot}
        </button>`;
    },
    icons: {
        check: `<i class="fa fa-check"></i>`,
        menuBar: `<i class="fas fa-bars text-right"></i>`,
    },
    invItem: (id, name, val) => {
        return `<div class="invoice-detail-item">
                    <div class="invoice-detail-name">${name}</div>
                    <div class="invoice-detail-value" id="${id}">${val}</div>
                </div>`;
    },
    p: (cn = "") => {
        return `<p>${cn}</p>`;
    },
};

// global util helper, test
// todo make static func at class
let util = {
    deepCopyObj(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    copyInstance(obj) {
        return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
    },
    makeClock(fn = null) {
        let dt = new Date();
        fn = fn || function (dt) {};

        return {
            dt: dt,
            intervalIns: setInterval(() => {
                dt = new Date();
                fn(dt);
            }, 1000),
        };
    },
	// util.setLoading
	setLoading(c=false){
		// cl("load "+c)
		if(c){
			$("#liLoading").attr("loading", "true").show()
		}else{
			$("#liLoading").attr("loading", "false").hide()
		}
	},
    // ty https://www.w3schools com/howto/howto_js_countdown.asp
    // create countdown
    createTimeCounter({
        fromDatetime,
        toDatetime,
        useAbs = false,
        callback = null,
    }) {
        // Set the date we're counting down to
        var countDownDate = new Date(toDatetime).getTime();

        if (callback == null) {
            callback = function (datetimeLeft) {};
        }
        // Update the count down every 1 second
        // var now = new Date(fromDatetime).getTime();
        var counter = 0;
        var x = setInterval(function () {
            // Get today's date and time
            var now = null;

            if (counter == 0) {
                now = new Date(fromDatetime).getTime();
            } else {
                var temp = new Date(fromDatetime).getTime();
                now = new Date(counter * 1000).getTime();
                now += temp;
            }

            // Find the distance between now and the count down date
            var distance = countDownDate - now;
            distance = useAbs ? Math.abs(distance) : distance;
            var sixtyk = 1000 * 60;

            // Time calculations for days, hours, minutes and seconds
            var datetimeLeft = {
                raw: distance,
                days: Math.floor(distance / (sixtyk * 60 * 24)),
                hours: Math.floor(
                    (distance % (sixtyk * 60 * 24)) / (sixtyk * 60)
                ),
                minutes: Math.floor((distance % (sixtyk * 60)) / sixtyk),
                seconds: Math.floor((distance % sixtyk) / 1000),
                isExpired: false,
            };

            callback(datetimeLeft);
            // If the count down is finished, write some text
            if (distance < 0) {
                clearInterval(x);

                datetimeLeft.isExpired = true;
                callback(datetimeLeft);
                // document.getElementById("demo").innerHTML = "EXPIRED";
            }
            counter++;
        }, 1000);

        return x;
    },
    createCtdown(fromDatetime, toDatetime, callback = null) {
        return util.createTimeCounter({
            fromDatetime: fromDatetime,
            toDatetime: toDatetime,
            useAbs: false,
            callback,
        });
    },
    // cleave thousand
    createCleave(el = ".fcurrency") {
        return new Cleave(el, {
            numeral: true,
            numeralThousandsGroupStyle: "thousand",
        });
    },
    DatetimeLeftParser(DatetimeLeftObj) {
        return {
            formatted(n = 1) {
                var dtlo = DatetimeLeftObj;
                var ret = "";
                if (!dtlo.isExpired) {
                    switch (n) {
                        case "s":
                            let pads = (e) => e.toString().padStart(2, "0");

                            ret = `${pads(dtlo.hours)}:${pads(
                                dtlo.minutes
                            )}:${pads(dtlo.seconds)}`;
                            break;
                        case "md":
                            ret =
                                dtlo.minutes +
                                " menit " +
                                dtlo.seconds +
                                " detik";
                            break;
                        default:
                            ret =
                                dtlo.days +
                                " Hari " +
                                dtlo.hours +
                                " jam " +
                                dtlo.minutes +
                                " menit " +
                                dtlo.seconds +
                                " detik";
                    }
                } else {
                    ret = "Expired";
                }
                return ret;
            },
        };
    },
    moDBDate(dt) {
        // get date like 2022-02-21 09:42:41
        // cl(dt);
        // wrong
        // return moment(dt).format("Y-MM-DD HH:MM:SS");
        return moment(dt).format("Y-MM-DD HH:mm:ss");
    },
    getNow() {
        return util.moDBDate(new Date());
    },
    toDatetimeLocale(dt) {
        if (!(dt instanceof Date)) {
            dt = new Date(dt);
        }
        return dt.toLocaleDateString() + " " + dt.toLocaleTimeString();
    },
    dmyhm(date) {
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var year = date.getFullYear();
        var hm = date.getHours() + ":" + date.getMinutes();

        return day + "/" + month + "/" + year + " " + hm;
    },
    absInt(num) {
        return Math.abs(parseInt(num));
    },
    floatId(num) {
        return parseFloat(num).toLocaleString("id-ID");
    },
	// util.currencyFloatFmt()
    currencyFloatFmt(num, fmt = "id") {
        return util.currencyFmt(util.floatId(num), fmt);
    },
    currencyFmt(num, fmt = "id") {
        switch (fmt) {
            case "id":
            default:
                return `Rp${num},00`;
                break;
        }
        // Rp1.000,00
        /*
        util.arrToSelect2([{id:1, name:"abc"},{ id:3, name:"xab"}], (e,i)=>{
            return {id: e.id, text: e.name}
        })
         */
    },
    arrToSelect2(arr = [], func = null) {
        func =
            func ||
            function (e, i) {
                return e;
            };

        let ret = [];

        arr.forEach((e, i) => {
            ret.push(func(e, i));
        });

        return ret;
    },
};

function GetFormattedDate() {
    var todayTime = new Date();
    return month + "/" + day + "/" + year;
}

/*

preview upload after select file

example:

setUploadPreview(
    document.querySelector("input[name=logo]"), 
    document.querySelector("#imlogo"),
    true,
    function(){
        var el = document.querySelector("input[name=logo_url]")
        el.value = ""
    }
)
*/
function setUploadPreview(field, img, imgel = true, callback = null) {
    const image_input = field;
    image_input.addEventListener("change", function () {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const uploaded_image = reader.result;
            if (imgel) {
                img.src = uploaded_image;
            } else {
                img.style.backgroundImage = `url(${uploaded_image})`;
            }
            if (callback) {
                callback(reader);
            }
        });
        reader.readAsDataURL(this.files[0]);
    });

    return image_input;
}

function wrapPic(img) {
    if (!img) {
        return null;
    }

    let hasHttp = img.indexOf("http") === 0;

    if (hasHttp) {
        return img;
    }

    return img ? groutes.asset + img : null;
}
// global behaviour @checkbox

function evtCheckbox() {
    let fn = function (e) {
        let v = $(this).val();
        cl(v);
        if (v == "0") {
            $(this).val("1");
        } else {
            $(this).val("0");
        }
    };

    $("input[type=checkbox]").on("click", fn);
}

/*
sample

renderOpt({
    arr: [{
        id: 1,
        name: "name"
    },
    {
        id: 2,
        name: "name 2"
    }], mapping: {
        value: "id",
        label: "name",
}})

*/
function renderOpt({ arr, mapping = {}, initVal = "Pilih" }) {
    let usingArr = mapping === "arr";
    if (!mapping) {
        mapping = {
            value: "x",
            label: "x",
        };
    }

    let ret = `<option value="">${initVal}</option>`;
    let t = `<option value="[v]">[label]</option>`;
    arr.forEach((e) => {
        if (usingArr) {
            ret += t.replace("[v]", e).replace("[label]", e);
        } else {
            ret += t
                .replace("[v]", e[mapping.value])
                .replace("[label]", e[mapping.label]);
        }
    });
    return ret;
}

function generalCRUD(crud) {
    if (!crud) {
        crud = new CRUD();
    }
    crud.setFullEvent();

    return crud;
}

function initCRUD(crud = null) {
    if (!crud) {
        crud = new CRUD();
    }
    crud.routes = routes;
    crud.setDatatable(dt);

	// global toastr for regular crud case
	crud.addUpdateThenStatements(async (e)=>{
		if(e.success){
			toastr.success(e.message)
		}else{
			toastr.error(e.message)
		}
	})

    let c = generalCRUD(crud);

    return c;
}

/*
initCRUD((function(){
	crud = new CRUD();
	crud.setPrimaryKey("id_order")
	return crud
})())
*/

const cl = console.log;

// prototypes
String.prototype.noPunctuation = function () {
    let x = this.match(/\w/g);
    return x ? (x.length > 0 ? x.join("") : 0) : 0;
};

function strMaxN(str, n) {
    return (str = str ? (str.length > n ? str.substr(0, n) + "..." : str) : "");
}

String.prototype.max32 = function () {
    return strMaxN(this, 32);
};

String.prototype.max64 = function () {
    return strMaxN(this, 64);
};

Object.defineProperty(String.prototype, 'capitalize', {
	value: function() {
	  return this.charAt(0).toUpperCase() + this.slice(1);
	},
	enumerable: false
});

Number.prototype.separate = function(){
	return util.floatId(this)
}

Number.prototype.toIDR = function(){
	return util.currencyFloatFmt(this)
}

Array.prototype.unique = function() {
	let arr = this
	var hash = {}, result = [];
	for ( var i = 0, l = arr.length; i < l; ++i ) {
		if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
			hash[ arr[i] ] = true;
			result.push(arr[i]);
		}
	}
	return result;
}

/*
let arr = [{
	id: 1,
	name: "name"
},{
		id: 2,
		name: "name 2"
	}]
arr.toOpts({
	mapping: {
		value: "id",
		label: "name",
}})
*/
Array.prototype.toOpts = function({mapping={}, initVal = "Pilih"}){
	let usingArr = mapping === "arr";
	if (!mapping) {
		mapping = {
			value: "x",
			label: "x",
		};
	}

	if(!fn){
		fn = (e)=> `<option value=${e}>${e}</option>`
	}

	let ret = `<option value="">${initVal}</option>`;
	let t = `<option value="[v]">[label]</option>`;

	return ret + this.map(function(){
		if (usingArr) {
            return t.replace("[v]", e).replace("[label]", e);
        } else {
            return t
                .replace("[v]", e[mapping.value])
                .replace("[label]", e[mapping.label]);
        }
	}).join("")
}