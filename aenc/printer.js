// todo create printer builder / facade
let printerStyles = {
	print2: `<style>
	@media print {
		body,
		.app-default {
			background-color: white !important;
		}
		@page {
			size: auto;
			size: A4;
			margin: 2cm 1cm;
		}
	}
	</style>`,
	print1: `<style>
	@charset "UTF-8";
	/*!
	* Bootstrap  v5.3.0-alpha1 (https://getbootstrap.com/)
	* Copyright 2011-2022 The Bootstrap Authors
	* Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
	*/

	@media screen {
		#printSection {
			display: none;
		}

		.for-print {
			visibility: hidden;
			display: none;
		}
	}

	@media print {
		body * {
			visibility: hidden;
			font-family: Verdana, Arial;
		}

		body,
		.app-default {
			background-color: white !important;
		}

		@page {
			size: auto;
			size: A4;
			margin: 2cm 1cm;
		}



		/* table td {
		word-break: break-word;
		vertical-align: top;
		white-space: normal !important;
	} */

		#printSection,
		#printSection * {
			visibility: visible;
		}

		#printSection {
			position: absolute;
			left: 0;
			margin-left: 2px;
			margin-right: 2px;
			top: 0;
		}

		.title-laporan {
			font-size: 10px !important;
		}
	}

	.img150 {
		width: 100%;
		max-width: 150px;
	}

	.img300 {
		width: 100%;
		max-width: 300px;
	}
	</style>`
}