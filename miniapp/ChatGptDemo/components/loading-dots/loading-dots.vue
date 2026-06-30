<template>
	<view class="loading-dots">
		<view v-for="(dot, index) in dots" :key="index" :class="['dot', `dot-${index+1}`]"></view>
	</view>
</template>

<style>
	.loading-dots {
		display: flex;
		justify-content: space-between;
		width: 40px;
		height: 10px;
	}

	.dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		animation: loading 1.5s infinite;
	}


	.dot-1 {
		background-color: #000;
	}

	.dot-2 {
		background-color: #000;
		animation-delay: 0.375s;
	}

	.dot-3 {
		background-color: #000;
		animation-delay: 0.75s;
	}

	.dot-4 {
		background-color: #000;
		animation-delay: 1.125s;
	}

	@keyframes loading {
		0% {
			opacity: 0.2;
		}

		25% {
			opacity: 1;
		}

		50% {
			opacity: 0.2;
		}

		75% {
			opacity: 0.2;
		}

		100% {
			opacity: 0.2;
		}
	}
</style>

<script>
	export default {
		data() {
			return {
				dots: [1, 2, 3, 4]
			};
		}
	};
</script>