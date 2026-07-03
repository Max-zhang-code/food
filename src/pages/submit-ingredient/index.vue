<template>
  <view class="container">
    <view class="form-title">{{ isEditing ? '编辑食材' : '提交新食材' }}</view>

    <view class="form-item">
      <text class="label">食材名 *</text>
      <input v-model="form.name" class="input" placeholder="如：鸡蛋" />
    </view>

    <view class="form-item">
      <text class="label">分类 *</text>
      <picker :range="categories" @change="onCategoryChange">
        <view class="picker-display">
          {{ form.category || '请选择分类' }}
          <text class="arrow">›</text>
        </view>
      </picker>
    </view>

    <view class="form-item">
      <text class="label">Emoji 图标（可选）</text>
      <view v-if="form.icon" class="selected-emoji" @click="form.icon = ''">
        {{ form.icon }}
        <text class="clear-hint">（点击清除）</text>
      </view>
      <view class="emoji-grid">
        <view
          v-for="e in emojiOptions"
          :key="e"
          class="emoji-item"
          :class="{ active: form.icon === e }"
          @click="form.icon = e"
        >{{ e }}</view>
      </view>
    </view>

    <view class="form-item">
      <text class="label">图片</text>
      <button class="upload-btn" @click="chooseImage">
        {{ compressedTempPath ? '重新选择' : '选择图片（可选）' }}
      </button>
      <image
        v-if="form.image"
        :src="form.image"
        class="preview-img"
        mode="aspectFill"
      />
    </view>

    <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
      {{ submitting ? '保存中...' : (isEditing ? '保存修改' : '提交') }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const categories = ['蔬菜', '肉类', '蛋类', '调味', '豆制品', '其他']

const emojiOptions = ['🥬', '🧅', '🧄', '🥕', '🌽', '🥒', '🍅', '🫑', '🥔', '🍄', '🥩', '🍗', '🥓', '🍖', '🦐', '🐟', '🦀', '🥚', '🧈', '🧀', '🫘', '🍚', '🍜', '🧂', '🫒', '🥜', '🌶']
const compressedTempPath = ref('')
const submitting = ref(false)
const isEditing = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  category: '',
  icon: '',
  image: '',
})

onLoad((options: any) => {
  if (options?.ingredientId) {
    isEditing.value = true
    editingId.value = options.ingredientId
  }
})

onMounted(async () => {
  if (isEditing.value) {
    uni.showLoading({ title: '加载中...' })
    try {
      const db = wx.cloud.database()
      const res = await db.collection('ingredients').doc(editingId.value).get()
      const ing = (res as any).data
      if (ing) {
        form.name = ing.name
        form.category = ing.category || ''
        form.icon = ing.icon || ''
        form.image = ing.image || ''
      }
    } catch (_) {}
    finally { uni.hideLoading() }
  }
})

const onCategoryChange = (e: any) => {
  form.category = categories[e.detail.value]
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      uni.showLoading({ title: '处理图片...' })
      try {
        const compressed = await new Promise<any>((resolve, reject) => {
          uni.compressImage({
            src: tempPath,
            quality: 80,
            success: resolve,
            fail: reject,
          })
        })
        let finalPath = compressed.tempFilePath
        if (compressed.size && compressed.size > 500 * 1024) {
          const recompressed = await new Promise<any>((resolve) => {
            uni.compressImage({
              src: compressed.tempFilePath,
              quality: 60,
              success: resolve,
              fail: () => resolve(compressed),
            })
          })
          finalPath = recompressed.tempFilePath || compressed.tempFilePath
        }
        compressedTempPath.value = finalPath
        form.image = finalPath
      } catch (_) {
        uni.showToast({ title: '图片处理失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const handleSubmit = async () => {
  if (!form.name || !form.category) {
    uni.showToast({ title: '请填写食材名和分类', icon: 'none' })
    return
  }
  submitting.value = true
  uni.showLoading({ title: '提交中...' })
  try {
    if (compressedTempPath.value) {
      const cloudPath = `ingredients/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: compressedTempPath.value })
      form.image = uploadRes.fileID
    }

    const result = await wx.cloud.callFunction({
      name: isEditing.value ? 'updateIngredient' : 'submitIngredient',
      data: isEditing.value
        ? { ingredient_id: editingId.value, name: form.name, category: form.category, icon: form.icon, image: form.image }
        : { name: form.name, category: form.category, icon: form.icon, image: form.image },
    })
    const data = result.result as any
    if (data.code) {
      uni.showToast({ title: data.message, icon: 'none' })
      return
    }

    uni.showToast({ title: '提交成功！', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e: any) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style scoped>
.container { padding: 20rpx; }
.form-title { font-size: 36rpx; font-weight: bold; margin-bottom: 30rpx; }
.form-item { margin-bottom: 30rpx; }
.label { font-size: 28rpx; color: #333; display: block; margin-bottom: 12rpx; }
.input { border: 1px solid #e0e0e0; border-radius: 20rpx; padding: 16rpx; font-size: 28rpx; }
.picker-display {
  border: 1px solid #e0e0e0; border-radius: 20rpx; padding: 16rpx;
  font-size: 28rpx; display: flex; justify-content: space-between; align-items: center;
}
.picker-display .arrow { font-size: 32rpx; color: #ccc; }
.selected-emoji { font-size: 64rpx; text-align: center; padding: 16rpx 0; margin-bottom: 12rpx; }
.clear-hint { font-size: 22rpx; color: #999; }
.emoji-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.emoji-item {
  width: calc(20% - 10rpx); text-align: center; font-size: 44rpx;
  padding: 12rpx 0; border-radius: 20rpx; background: #f5f5f5;
}
.emoji-item.active { background: #FF6B4A; }
.upload-btn { font-size: 26rpx; color: #FF6B4A; background: #fff5f2; border: none; }
.preview-img { width: 200rpx; height: 200rpx; border-radius: 20rpx; margin-top: 12rpx; }
.submit-btn {
  background: #FF6B4A; color: #fff; border: none;
  width: 100%; margin-top: 40rpx; padding: 24rpx;
}
</style>
