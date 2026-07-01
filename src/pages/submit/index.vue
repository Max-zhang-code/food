<template>
  <view class="container">
    <view class="form-title">{{ isEditing ? '编辑菜品' : '提交新菜品' }}</view>

    <view class="form-item">
      <text class="label">菜品名 *</text>
      <input v-model="form.name" class="input" placeholder="如：番茄炒蛋" />
    </view>

    <view class="form-item">
      <text class="label">描述</text>
      <textarea v-model="form.description" class="textarea" placeholder="一句话描述这道菜" />
    </view>

    <view class="form-item">
      <text class="label">烹饪时间（分钟）</text>
      <input v-model.number="form.cooking_time" class="input" type="number" placeholder="15" />
    </view>

    <view class="form-item">
      <text class="label">图片</text>
      <button class="upload-btn" @click="chooseImage">
        {{ form.image ? '重新选择' : '选择图片' }}
      </button>
      <image v-if="form.image" :src="form.image" class="preview-img" mode="aspectFill" />
    </view>

    <view class="form-item">
      <text class="label">所需食材 *</text>
      <view class="ingredient-select">
        <view
          v-for="ing in allIngredients"
          :key="ing._id"
          class="ing-tag"
          :class="{ selected: form.ingredient_ids.includes(ing._id) }"
          @click="toggleIng(ing._id)"
        >
          {{ ing.name }}
        </view>
      </view>
    </view>

    <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
      {{ submitting ? '提交中...' : (isEditing ? '重新提交审核' : '提交审核') }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useDishManageStore } from '@/stores/dish-manage'
import { useMenuStore } from '@/stores/menu'

const dishStore = useDishManageStore()
const menuStore = useMenuStore()
const allIngredients = ref<any[]>([])
const submitting = ref(false)

const isEditing = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  description: '',
  cooking_time: 15,
  image: '',
  ingredient_ids: [] as string[],
})

onMounted(async () => {
  await menuStore.fetchAllIngredients()
  allIngredients.value = menuStore.ingredients
})

const toggleIng = (id: string) => {
  const idx = form.ingredient_ids.indexOf(id)
  if (idx >= 0) form.ingredient_ids.splice(idx, 1)
  else form.ingredient_ids.push(id)
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      uni.showLoading({ title: '压缩上传中...' })
      try {
        // 第一步：前端压缩（质量 80%，肉眼几乎无差）
        const compressed = await new Promise<any>((resolve, reject) => {
          uni.compressImage({
            src: tempPath,
            quality: 80,
            success: resolve,
            fail: reject,
          })
        })

        // 第二步：上传到云存储
        let uploadPath = compressed.tempFilePath

        // 如果压缩后仍然过大（>500KB），二次降质
        if (compressed.size && compressed.size > 500 * 1024) {
          const recompressed = await new Promise<any>((resolve) => {
            uni.compressImage({
              src: compressed.tempFilePath,
              quality: 60,
              success: resolve,
              fail: () => resolve(compressed), // 二次压缩失败用一次结果
            })
          })
          uploadPath = recompressed.tempFilePath || compressed.tempFilePath
        }

        const cloudPath = `dishes/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
        const uploadRes = await uniCloud.uploadFile({ cloudPath, filePath: uploadPath })
        form.image = uploadRes.fileID
      } catch (e: any) {
        uni.showToast({ title: '图片上传失败，请重试', icon: 'none' })
        console.error('图片上传失败:', e.message)
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const handleSubmit = async () => {
  if (!form.name || form.ingredient_ids.length === 0) {
    uni.showToast({ title: '请填写菜品名和食材', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    if (isEditing.value) {
      await dishStore.resubmitDish(editingId.value, { ...form })
    } else {
      await dishStore.submitDish({ ...form })
    }
    uni.showToast({ title: '提交成功！', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.container { padding: 20rpx; }
.form-title { font-size: 36rpx; font-weight: bold; margin-bottom: 30rpx; }
.form-item { margin-bottom: 30rpx; }
.label { font-size: 28rpx; color: #333; display: block; margin-bottom: 12rpx; }
.input { border: 1px solid #e0e0e0; border-radius: 12rpx; padding: 16rpx; font-size: 28rpx; }
.textarea { border: 1px solid #e0e0e0; border-radius: 12rpx; padding: 16rpx; font-size: 28rpx; height: 120rpx; }
.upload-btn { font-size: 26rpx; color: #07C160; background: #f0faf4; border: none; }
.preview-img { width: 200rpx; height: 200rpx; border-radius: 12rpx; margin-top: 12rpx; }
.ingredient-select { display: flex; flex-wrap: wrap; gap: 16rpx; }
.ing-tag {
  padding: 12rpx 24rpx; background: #f0f0f0; border-radius: 32rpx; font-size: 26rpx;
}
.ing-tag.selected { background: #07C160; color: #fff; }
.submit-btn {
  background: #07C160; color: #fff; border: none;
  width: 100%; margin-top: 40rpx; padding: 24rpx;
}
</style>
