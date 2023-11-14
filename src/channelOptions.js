export const channelOptions = [
  {
    value: 'relay_channel',
    label: '继电器通道',
    children: [
      {value: '1', label: '1'}, {value: '2', label: '2'},
      {value: '3', label: '3'}, {value: '4', label: '4'},
      {value: '5', label: '5'}, {value: '6', label: '6'},
      {value: '7', label: '7'}, {value: '8', label: '8'},
      {value: '9', label: '9'}, {value: '10', label: '10'},
      {value: '11', label: '11'}, {value: '12', label: '12'},
      {value: '13', label: '13'}, {value: '14', label: '14'},
      {value: '15', label: '15'}, {value: '16', label: '16'}
    ]
  },
  {
    value: 'voltage1_channel',
    label: '可采 0-6.5V 电压通道',
    children: [
      {value: '17', label: '1'}, {value: '18', label: '2'},
      {value: '19', label: '3'}, {value: '20', label: '4'}
    ]
  },
  {
    value: 'voltage2_channel',
    label: '可采 6.5-50V 电压通道',
    children: [
      {value: '21', label: '1'}, {value: '22', label: '2'},
      {value: '23', label: '3'}, {value: '24', label: '4'},
      {value: '25', label: '5'}, {value: '26', label: '6'},
      {value: '27', label: '7'}, {value: '28', label: '8'}
    ]
  },
  {
    value: 'voltage3_channel',
    label: '可采 50-100V 电压通道',
    children: [
      {value: '29', label: '1'}, {value: '30', label: '2'},
      {value: '31', label: '3'}, {value: '32', label: '4'},
      {value: '33', label: '5'}, {value: '34', label: '6'},
      {value: '35', label: '7'}, {value: '36', label: '8'}
    ]
  },
  {
    value: 'voltage4_channel',
    label: '可采 100-150V 电压通道',
    children: [
      {value: '37', label: '1'}, {value: '38', label: '2'}
    ]
  },
  {
    value: 'voltage5_channel',
    label: '可采 150-1000V 电压通道',
    children: [
      {value: '39', label: '1'}, {value: '40', label: '2'}
    ]
  },
  {
    value: 'voltage6_channel',
    label: '可采 AC220V 电压通道',
    children: [
      {value: '41', label: '1'}, {value: '42', label: '2'},
      {value: '43', label: '3'}, {value: '44', label: '4'},
    ]
  },
  {
    value: 'voltage7_channel',
    label: '可采 AC380V 电压通道',
    children: [
      {value: '45', label: '1'}, {value: '46', label: '2'}
    ]
  },
  {
    value: '47',
    label: '可采 0-5A 电流通道'
  },
  {
    value: '48',
    label: '可采 0-20A 电流通道'
  },
  {
    value: '49',
    label: '可采 0-30A 电流通道'
  },
  {
    value: '50',
    label: '可采 0-100A 电流通道'
  },
  {
    value: '51',
    label: '待定通道'
  }
]

const generateChannelArray = (options) => {
  const channelArray = options.map(option => {
    if (option.children) {
      return option.children.map(child => `${option.label}-${child.label}`)
    } else {
      return option.label
    }
  }).flat()
  return channelArray
}

export const channelArray = generateChannelArray(channelOptions)
